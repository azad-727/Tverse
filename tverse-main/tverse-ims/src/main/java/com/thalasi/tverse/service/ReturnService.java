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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class ReturnService {

    @Autowired private SalesOrderRepo orderRepo;
    @Autowired private SalesReturnRepo returnRepo;
    @Autowired private InventoryService inventoryService; // Reuse existing inventory logic
    @Autowired private ProductVariantRepo variantRepo;
    @Autowired private MappingService mappingService;

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
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
                orders = orderRepo.findByOrderId(request.getTrackingId());
            }
            if (orders.isEmpty()){
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
            if(!skuToRestock.equalsIgnoreCase("UNKNOWN_ITEM")) {
                if (variantRepo.findBySku(skuToRestock).isEmpty()) {
                    throw new RuntimeException("Cannot process External Return: SKU not found in Master Catalog");
                }
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
        if (shouldRestock && !skuToRestock.equalsIgnoreCase("UNKNOWN_ITEM")) {
            // Resolve the incoming SKU down to its true internal master SKUs and quantities (handles singles and bundles)
            Map<String, Integer> resolvedComponents = mappingService.resolveSku(skuToRestock, qtyToRestock);

            // Loop through every single resolved component piece to restock them individually
            for (Map.Entry<String, Integer> entry : resolvedComponents.entrySet()) {
                String masterSku = entry.getKey();
                int exactReturnQty = entry.getValue(); // Respects bundle multipliers! (e.g., 2 units * 2 packs = 4 tees)

                Optional<productVariant> variant = variantRepo.findBySku(masterSku);
                if (variant.isPresent()) {
                    StockAdjustmentDTO adj = new StockAdjustmentDTO();
                    adj.setVariantId(variant.get().getId());
                    adj.setQuantity(exactReturnQty);
                    adj.setOperation("ADD"); // Add back to stock available on shelves
                    adj.setReason("Return Inward [" + returnRecord.getReturnType() + "]: Resolved from channel alias " + skuToRestock);
                    adj.setPerformedBy(request.getStaffName());

                    // Fire the adjustment to your existing inventory service layer
                    inventoryService.adjustStock(adj);
                } else {
                    System.out.println("CRITICAL CORRUPTION ALERT: Resolved Master SKU [" + masterSku + "] missing from Catalog tables!");
                }
            }
        }

        // 6. SAVE
        returnRepo.save(returnRecord);
    }
}