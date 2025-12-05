package com.thalasi.tverse.service;


import com.thalasi.tverse.dto.StockAdjustmentDTO;
import com.thalasi.tverse.model.inventoryLog;
import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.inventorylogRepo;
import com.thalasi.tverse.repository.productvariantRepo;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Optional;
@Service
public class InventoryService {

    @Autowired
    private productvariantRepo variantRepo;

    @Autowired
    private inventorylogRepo logRepo;

    @Transactional
    public void adjustStock(StockAdjustmentDTO request) {
        // 1. Fetch Variant
        productVariant variant = variantRepo.findById(request.getVariantId())
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        int currentStock = variant.getStockOnHand();
        int changeAmount = request.getQuantity();
        int newStock = 0;

        // 2. Calculate
        if ("ADD".equalsIgnoreCase(request.getOperation())) {
            newStock = currentStock + changeAmount;
        } else if ("DEDUCT".equalsIgnoreCase(request.getOperation())) {
            if (currentStock < changeAmount) {
                throw new RuntimeException("Insufficient stock!");
            }
            newStock = currentStock - changeAmount;
            changeAmount = -changeAmount; // Log as negative
        } else {
            throw new RuntimeException("Invalid Operation");
        }

        // 3. Update DB
        variant.setStockOnHand(newStock);
        variantRepo.save(variant);

        // 4. Audit Log
        inventoryLog log = new inventoryLog();
        log.setVariant(variant);
        log.setChangeType("MANUAL_ADJ");
        log.setQuantityChanged(changeAmount);
        log.setNewStockOnHand(newStock);
        log.setReason(request.getReason());
        log.setPerformedBy(request.getPerformedBy());

        logRepo.save(log);
    }
    @Transactional
    public String processBulkStockFile(MultipartFile file) throws IOException {
        int successCount = 0;
        int failCount = 0;
        StringBuilder errorReport = new StringBuilder();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                int rowIndex=row.getRowNum();
                if (rowIndex < 2) continue; // Skip Header

                // 1. Read Columns
                String sku = formatter.formatCellValue(row.getCell(0)).trim();
                String operation = formatter.formatCellValue(row.getCell(1)).toUpperCase().trim(); // ADD, REMOVE, LOST, MOVE
                int qty = 0;
                try {
                    qty = Integer.parseInt(formatter.formatCellValue(row.getCell(2)));
                } catch (Exception e) { qty = 0; }

                String reason = formatter.formatCellValue(row.getCell(3)).trim();
                String newLocation = formatter.formatCellValue(row.getCell(4)).trim();

                if (sku.isEmpty()) continue;

                // 2. Find Product
                Optional<productVariant> opt = variantRepo.findBySku(sku);
                if (opt.isEmpty()) {
                    failCount++;
                    errorReport.append("Row ").append(row.getRowNum() + 1).append(": SKU Not Found (").append(sku).append(")\n");
                    continue;
                }

                productVariant v = opt.get();
                int currentStock = v.getStockOnHand();
                int changeAmount = 0;
                String changeType = "MANUAL_ADJ";

                // 3. Switch Logic based on Operation
                try {
                    switch (operation) {
                        case "ADD":
                            v.setStockOnHand(currentStock + qty);
                            changeAmount = qty;
                            if(reason.isEmpty()) reason = "Bulk Add";
                            break;

                        case "REMOVE":
                            if (currentStock < qty) throw new RuntimeException("Insufficient Stock");
                            v.setStockOnHand(currentStock - qty);
                            changeAmount = -qty; // Negative for log
                            if(reason.isEmpty()) reason = "Bulk Remove";
                            break;

                        case "LOST": // Same as remove, but specific log type
                            if (currentStock < qty) throw new RuntimeException("Insufficient Stock");
                            v.setStockOnHand(currentStock - qty);
                            changeAmount = -qty;
                            changeType = "LOST/DAMAGED";
                            if(reason.isEmpty()) reason = "Reported Lost in Bulk";
                            break;

                        case "MOVE":
                            if (newLocation.isEmpty()) throw new RuntimeException("New Location required for MOVE");
                            String oldLoc = v.getWarehouseLocation();
                            v.setWarehouseLocation(newLocation); // Update Location
                            changeAmount = 0; // Stock doesn't change
                            changeType = "LOCATION_MOVE";
                            reason = "Moved from " + oldLoc + " to " + newLocation;
                            break;

                        default:
                            throw new RuntimeException("Invalid Operation: " + operation);
                    }

                    // 4. Save Changes
                    variantRepo.save(v);

                    // 5. Audit Log
                    inventoryLog log = new inventoryLog();
                    log.setVariant(v);
                    log.setChangeType(changeType);
                    log.setQuantityChanged(changeAmount);
                    log.setNewStockOnHand(v.getStockOnHand());
                    log.setReason(reason);
                    log.setPerformedBy("BulkUpload"); // Replace with User ID later
                    logRepo.save(log);

                    successCount++;

                } catch (Exception e) {
                    failCount++;
                    errorReport.append("Row ").append(row.getRowNum() + 1).append(": ").append(e.getMessage()).append("\n");
                }
            }
        }

        return "Processed: " + successCount + " successful. " + failCount + " failed.\n" + errorReport.toString();
    }
}