package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.productRequestDTO;
import com.thalasi.tverse.dto.productRequestDTO.VariantDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExcelUploadService {

    @Autowired
    private catalogService catalogService;

    private final DataFormatter dataFormatter = new DataFormatter();

    public void processBulkUpload(MultipartFile file) throws IOException {
        System.out.println("--- STARTED BULK UPLOAD (SMART MODE) ---");

        Map<String, productRequestDTO> batchMap = new HashMap<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                int rowIndex = row.getRowNum();
                if (rowIndex < 2) continue; // Skip Header & Description

                String sku = getCellValue(row, 0);
                String type = getCellValue(row, 1);
                String parentSku = getCellValue(row, 2);

                if (sku.isEmpty()) continue;

                // --- PARENT LOGIC ---
                if (type.equalsIgnoreCase("Parent")) {
                    productRequestDTO dto = batchMap.computeIfAbsent(sku, k -> new productRequestDTO());

                    // Try to read data (might be empty based on your file)
                    String name = getCellValue(row, 3);
                    if (!name.isEmpty()) dto.setProductName(name);

                    String brand = getCellValue(row, 4);
                    if (!brand.isEmpty()) dto.setBrandName(brand);

                    String cat = getCellValue(row, 5);
                    if (!cat.isEmpty()) dto.setCategoryName(cat);

                    dto.setHsnCode(getCellValue(row, 12));
                    dto.setTaxRate(getNumericValue(row, 13));
                    dto.setDescription(getCellValue(row, 14));
                    dto.setImageUrl(getCellValue(row, 15));

                    if (dto.getVariants() == null) dto.setVariants(new ArrayList<>());
                }

                // --- CHILD LOGIC ---
                else {
                    String groupKey = parentSku.isEmpty() ? sku : parentSku;
                    productRequestDTO parentDto = batchMap.computeIfAbsent(groupKey, k -> new productRequestDTO());
                    if (parentDto.getVariants() == null) parentDto.setVariants(new ArrayList<>());

                    // --- SMART FIX: BACKFILL PARENT DATA FROM CHILD ---
                    // If Parent Name is missing, steal it from this Child row!
                    if (parentDto.getProductName() == null || parentDto.getProductName().isEmpty()) {
                        System.out.println("   -> Backfilling Parent [" + groupKey + "] info from Child row " + rowIndex);
                        parentDto.setProductName(getCellValue(row, 3));
                        parentDto.setBrandName(getCellValue(row, 4));
                        parentDto.setCategoryName(getCellValue(row, 5));
                        parentDto.setHsnCode(getCellValue(row, 12));
                        parentDto.setTaxRate(getNumericValue(row, 13));
                        parentDto.setDescription(getCellValue(row, 14));
                        parentDto.setImageUrl(getCellValue(row, 15));
                    }

                    // Create Variant
                    VariantDTO variant = new VariantDTO();
                    variant.setSku(sku);
                    variant.setSize(getCellValue(row, 6));
                    variant.setColor(getCellValue(row, 7));
                    variant.setProcurementCost(getNumericValue(row, 8));
                    variant.setSupplierLeadTime(getIntegerValue(row, 9));
                    variant.setWarehouseLocation(getCellValue(row, 10));
                    variant.setInitialStock(getIntegerValue(row, 11));

                    parentDto.getVariants().add(variant);
                }
            }
        }

        // Save to Database
        int count = 0;
        for (Map.Entry<String, productRequestDTO> entry : batchMap.entrySet()) {
            productRequestDTO dto = entry.getValue();

            if (dto.getProductName() != null && !dto.getProductName().isEmpty()) {
                try {
                    catalogService.addNewProduct(dto);
                    count++;
                    System.out.println("✅ Saved Group: " + dto.getProductName());
                } catch (Exception e) {
                    System.out.println("❌ Error Saving " + entry.getKey() + ": " + e.getMessage());
                }
            } else {
                System.out.println("❌ SKIP: Group " + entry.getKey() + " is totally empty.");
            }
        }
        System.out.println("--- DONE. Saved " + count + " Products ---");
    }

    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index);
        return dataFormatter.formatCellValue(cell).trim();
    }

    private BigDecimal getNumericValue(Row row, int index) {
        String val = getCellValue(row, index);
        if (val.isEmpty()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(val.replaceAll(",", ""));
        } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private int getIntegerValue(Row row, int index) {
        String val = getCellValue(row, index);
        if (val.isEmpty()) return 0;
        try {
            return (int) Double.parseDouble(val);
        } catch (Exception e) { return 0; }
    }
}