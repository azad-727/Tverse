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
    public ProductionLot updateLotStatus(Long lotId, String newStatus, Map<String, Integer> rejections) {
        ProductionLot lot = lotRepo.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Lot not found"));

        lot.setStatus(newStatus);

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
            // FIXED: Use LocalDateTime and correct variable name
            lot.setCompletedDate(LocalDateTime.now());
        }
        return lotRepo.save(lot);
    }

    @Transactional
    public void cancelLot(Long lotId) {
        ProductionLot lot = lotRepo.findById(lotId).orElseThrow();
        if("COMPLETED".equals(lot.getStatus())) throw new RuntimeException("Cannot cancel completed lot");

        lot.setStatus("CANCELLED");
        // Optional: Logic to return unused fabric could go here
        lotRepo.save(lot);
    }

    @Transactional
    public void deleteLot(Long lotId) {
        lotRepo.deleteById(lotId);
    }
}