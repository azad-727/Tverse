package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.ReturnProcessDTO;
import com.thalasi.tverse.dto.StockAdjustmentDTO;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.model.SalesReturn;
import com.thalasi.tverse.repository.SalesOrderRepo;
import com.thalasi.tverse.repository.SalesReturnRepo;
import com.thalasi.tverse.repository.ProductVariantRepo;
import com.thalasi.tverse.model.productVariant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReturnService {

    @Autowired private SalesOrderRepo orderRepo;
    @Autowired private SalesReturnRepo returnRepo;
    @Autowired private InventoryService inventoryService; // Reuse existing inventory logic
    @Autowired private ProductVariantRepo variantRepo;

    @Transactional
    public void processReturn(ReturnProcessDTO request) {

        String skuToRestock = request.getSku();
        int qtyToRestock = request.getQuantity();
        String orderIdRef = "EXTERNAL_NA";
        // 1. VALIDATION: Check duplicates
        if (returnRepo.existsByTrackingId(request.getTrackingId())) {
            throw new RuntimeException("This return (Tracking ID) has already been processed.");
        }



        if(!request.isExternalOrder()){
            List<SalesOrder> orders = orderRepo.findByTrackingId(request.getTrackingId());


            if (orders.isEmpty()) {
                throw new RuntimeException("Order not found for this Tracking ID.");
            }

            SalesOrder targetOrder=orders.stream()
                    .filter(o->o.getSku().equalsIgnoreCase(request.getSku()))
                    .findFirst()
                    .orElseThrow(()->new RuntimeException("SKU not found in this Tracking ID"));
            orderIdRef=targetOrder.getOrderId();
        }
        else {
            orderIdRef = "EXTERNAL_" + request.getTrackingId();
            // We verify the SKU exists in our Catalog so we can restock it
            if(variantRepo.findBySku(skuToRestock).isEmpty()) {
                throw new RuntimeException("Cannot process External Return: SKU not found in Master Catalog");
            }
        }


        // 3. CREATE RETURN RECORD
        SalesReturn returnRecord = new SalesReturn();
        returnRecord.setTrackingId(request.getTrackingId());
        returnRecord.setChannelOrderId(orderIdRef);
        returnRecord.setSku(skuToRestock);
        returnRecord.setQty(qtyToRestock);
        returnRecord.setProcessedBy(request.getStaffName());
        returnRecord.setCourierPartner(request.getCourierPartner());
        returnRecord.setReturnChannel(request.getReturnChannel());
        returnRecord.setReturnType(request.getReturnType());

        boolean shouldRestock = false;

        // 4. WORKFLOW LOGIC
        if ("COURIER_RETURN".equalsIgnoreCase(request.getReturnType())) {
            // --- RTO FLOW ---
            // Courier returns are usually unopened, so we assume Good Condition
            returnRecord.setReturnMainReason("Courier Return");
            returnRecord.setReturnSubReason("RTO - Undelivered");
            returnRecord.setQcStatus("QC_PASS");
            returnRecord.setActionTaken("RESTOCKED");
            shouldRestock = true;
        }
        else {
            // --- CUSTOMER RETURN FLOW ---
            returnRecord.setReturnMainReason(request.getReturnMainReason());
            returnRecord.setReturnSubReason(request.getReturnSubReason());

            if (request.isGoodCondition()) {
                // QC PASSED
                returnRecord.setQcStatus("QC_PASS");
                returnRecord.setActionTaken("RESTOCKED");
                shouldRestock = true;
                System.out.print("Restocked");
            }
            else {
                // QC FAILED (Damaged/Wrong Item)
                returnRecord.setQcStatus("QC_FAIL");
                returnRecord.setActionTaken("SCRAPPED");
                shouldRestock = false;
                System.out.print("No Restocked");
            }
        }

        // 5. INVENTORY UPDATE
        if (shouldRestock) {
            // We need the Variant ID to call InventoryService
            Optional<productVariant> variant = variantRepo.findBySku(skuToRestock);
            if (variant.isPresent()) {
                StockAdjustmentDTO adj = new StockAdjustmentDTO();
                adj.setVariantId(variant.get().getId());
                adj.setQuantity(qtyToRestock);
                adj.setOperation("ADD"); // Add back to stock
                adj.setReason("Return Inward: " + returnRecord.getReturnType());
                adj.setPerformedBy(request.getStaffName());

                inventoryService.adjustStock(adj);
            }
        }

        // 6. SAVE
        returnRepo.save(returnRecord);
    }
}