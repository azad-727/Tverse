package com.thalasi.tverse.service;

import com.thalasi.tverse.model.Fabric;
import com.thalasi.tverse.model.LotItem;
import com.thalasi.tverse.model.ProductionLot;
import com.thalasi.tverse.repository.FabricRepo;
import com.thalasi.tverse.repository.ProductionLotRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class ManufacturingService {
    @Autowired
    private ProductionLotRepo lotRepo;
    @Autowired
    private FabricRepo fabricRepo;

    @Transactional
    public ProductionLot createLot(ProductionLot lot, Long fabricId) {
        Fabric fabric = fabricRepo.findById(fabricId)
                .orElseThrow(() -> new RuntimeException("Fabric not found"));

        if (fabric.getRemainingKgs() < lot.getFabricUsedKgs()) {
            throw new RuntimeException("Insufficient Fabric! Available:" + fabric.getRemainingKgs());
        }
        fabric.setRemainingKgs(fabric.getRemainingKgs() - lot.getFabricUsedKgs());
        fabricRepo.save(fabric);

        // Setup Lot
        lot.setFabric(fabric);
        lot.setStatus("NEW");
        lot.setLotNumber("LOT-" + System.currentTimeMillis());
        return lotRepo.save(lot);
    }

    @Transactional
    public ProductionLot updateLotStatus(Long lotId, String newStatus, Map<String, Integer> rejections, Map<String, Integer> cutSizes) {
        ProductionLot lot = lotRepo.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Lot not found"));

        // --- NEW LOGIC: Finishing the CUTTING stage ---
        // If the lot is CURRENTLY in Cutting, it means cutting is done and we are moving to the next stage.
        if ("CUTTING".equalsIgnoreCase(lot.getStatus())) {
            if (cutSizes == null || cutSizes.isEmpty()) {
                throw new RuntimeException("Must provide exact cut sizes when finishing the CUTTING stage.");
            }

            int exactTotalCut = 0;
            for (Map.Entry<String, Integer> entry : cutSizes.entrySet()) {
                if (entry.getValue() > 0) {
                    LotItem item = new LotItem();
                    item.setSize(entry.getKey());
                    item.setPlannedQty(entry.getValue());
                    item.setRejectedQty(0);
                    item.setProduceQty(entry.getValue());
                    lot.getSizedBreakdown().add(item);

                    exactTotalCut += entry.getValue();
                }
            }
            // Override the initial estimated quantity with the ACTUAL cut quantity
            lot.setTotalPlannedQty(exactTotalCut);
        }

        // Update the status to the next stage (Printing/Stitching)
        lot.setStatus(newStatus);

        // --- EXISTING LOGIC: Handle Rejections for other stages ---
        if (rejections != null && !rejections.isEmpty()) {
            for (LotItem item : lot.getSizedBreakdown()) {
                if (rejections.containsKey(item.getSize())) {
                    int rejected = rejections.get(item.getSize());
                    item.setRejectedQty(item.getRejectedQty() + rejected);
                    item.setProduceQty(item.getPlannedQty() - item.getRejectedQty());
                }
            }
        }

        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            lot.setCompletedDate(LocalDateTime.now());
        }

        return lotRepo.save(lot);
    }


    @Transactional
    public void cancelLot(Long lotId) {
        ProductionLot lot = lotRepo.findById(lotId).orElseThrow();
        if("COMPLETED".equals(lot.getStatus())) throw new RuntimeException("Cannot cancel completed lot");

        lot.setStatus("CANCELLED");

        if (lot.getFabric() != null) {
            Fabric fabric = lot.getFabric();
            fabric.setRemainingKgs(fabric.getRemainingKgs() + lot.getFabricUsedKgs());
            fabricRepo.save(fabric);
            System.out.println("MATERIAL RECONCILIATION SUCCESSFUL: Reverted " + lot.getFabricUsedKgs() + " Kgs back to roll " + fabric.getId());
        }

        lotRepo.save(lot);
    }

    @Transactional
    public void deleteLot(Long lotId) {

        ProductionLot lot = lotRepo.findById(lotId).orElse(null);
        if (lot == null) return;

        // If an uncompleted lot is physically deleted from records, automatically release its fabric allocation weight first
        if (!"CANCELLED".equalsIgnoreCase(lot.getStatus()) && !"COMPLETED".equalsIgnoreCase(lot.getStatus()) && lot.getFabric() != null) {
            Fabric fabric = lot.getFabric();
            fabric.setRemainingKgs(fabric.getRemainingKgs() + lot.getFabricUsedKgs());
            fabricRepo.save(fabric);
        }

        lotRepo.delete(lot);
    }
}