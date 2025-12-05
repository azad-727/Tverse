package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.PicklistResultDTO;
import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.productvariantRepo;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PicklistService {

    @Autowired
    private productvariantRepo variantRepo;

    public List<PicklistResultDTO> generatePicklist(MultipartFile file) throws IOException {

        Map<String, Integer> orderMap;
        String filename = file.getOriginalFilename();

        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            System.out.println("Processing CSV: " + filename);
            orderMap = parseCsvOrderFile(file);
        } else {
            System.out.println("Processing Excel: " + filename);
            orderMap = parseExcelOrderFile(file);
        }

        List<PicklistResultDTO> picklist = new ArrayList<>();

        // 2. Database Lookup Logic
        for (Map.Entry<String, Integer> entry : orderMap.entrySet()) {
            String orderSku = entry.getKey();
            Integer orderQty = entry.getValue();

            // Try to find Exact Match
            Optional<productVariant> variantOpt = variantRepo.findBySku(orderSku);

            PicklistResultDTO item = new PicklistResultDTO();
            item.setSku(orderSku);
            item.setOrderQty(orderQty);

            if (variantOpt.isPresent()) {
                productVariant v = variantOpt.get();
                item.setProductName(v.getProduct().getName());
                item.setImageUrl(v.getProduct().getImageUrl());

                String varDetails = "";
                if(v.getSize() != null && !v.getSize().isEmpty()) varDetails += "Size: " + v.getSize() + " ";
                if(v.getColor() != null && !v.getColor().isEmpty()) varDetails += "Color: " + v.getColor();
                item.setVariantDetails(varDetails);

                item.setLocation(v.getWarehouseLocation());
                item.setStockAvailable(v.getStockOnHand());

                if (v.getStockOnHand() < orderQty) {
                    item.setStatus("OUT_OF_STOCK");
                } else {
                    item.setStatus("READY");
                }
            } else {
                item.setProductName("UNKNOWN PRODUCT");
                item.setLocation("NOT FOUND");
                item.setStatus("SKU_MISMATCH");
            }

            picklist.add(item);
        }

        // Sort by Location
        return picklist.stream()
                .sorted(Comparator.comparing(PicklistResultDTO::getLocation, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    // --- PARSER 1: EXCEL (.xlsx) ---
    private Map<String, Integer> parseExcelOrderFile(MultipartFile file) throws IOException {
        Map<String, Integer> skuMap = new HashMap<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            int skuCol = -1;
            int qtyCol = -1;

            Row headerRow = sheet.getRow(0);
            for (Cell cell : headerRow) {
                String header = formatter.formatCellValue(cell).toLowerCase().trim();
                // Strict check for Excel too
                if (header.equals("sku") || header.equals("seller sku")) skuCol = cell.getColumnIndex();
                if (header.equals("quantity") || header.equals("qty")) qtyCol = cell.getColumnIndex();
            }

            if (skuCol == -1) throw new RuntimeException("Could not find 'SKU' column in Excel header");

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue;

                String sku = formatter.formatCellValue(row.getCell(skuCol)).trim();
                if (sku.isEmpty()) continue;

                int qty = 1;
                if (qtyCol != -1) {
                    try {
                        String q = formatter.formatCellValue(row.getCell(qtyCol));
                        qty = (int) Double.parseDouble(q);
                    } catch (Exception e) { qty = 1; }
                }
                skuMap.merge(sku, qty, Integer::sum);
            }
        }
        return skuMap;
    }

    // --- PARSER 2: CSV (.csv) - FLIPKART OPTIMIZED ---
    private Map<String, Integer> parseCsvOrderFile(MultipartFile file) throws IOException {
        Map<String, Integer> skuMap = new HashMap<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String[] headers = null;
            int skuIndex = -1;
            int qtyIndex = -1;

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                // Smart Split: Handles commas inside quotes (e.g., "Product, Name")
                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                // 1. Find Header Row
                if (headers == null) {
                    headers = columns;
                    for (int i = 0; i < headers.length; i++) {
                        String h = headers[i].toLowerCase().trim().replace("\"", "");

                        // FLIPKART SPECIFIC LOGIC:
                        // Look for exact "sku" match first.
                        if (h.equals("sku") || h.equals("seller sku")) {
                            skuIndex = i;
                        }
                        if (h.equals("quantity") || h.equals("qty")) {
                            qtyIndex = i;
                        }
                    }
                    if (skuIndex == -1) throw new RuntimeException("Could not find 'SKU' column. Found headers: " + Arrays.toString(headers));
                    continue;
                }

                // 2. Read Data
                if (columns.length > skuIndex) {
                    String sku = columns[skuIndex].trim().replace("\"", "");

                    // Skip garbage rows
                    if (sku.isEmpty() || sku.equalsIgnoreCase("sku")) continue;

                    int qty = 1;
                    if (qtyIndex != -1 && columns.length > qtyIndex) {
                        try {
                            String qVal = columns[qtyIndex].trim().replace("\"", "");
                            qty = (int) Double.parseDouble(qVal);
                        } catch (Exception e) { qty = 1; }
                    }

                    System.out.println("Found Order: " + sku + " (Qty: " + qty + ")");
                    skuMap.merge(sku, qty, Integer::sum);
                }
            }
        }
        return skuMap;
    }
}