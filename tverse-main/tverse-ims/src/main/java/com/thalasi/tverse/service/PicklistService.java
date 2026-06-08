    package com.thalasi.tverse.service;

    import com.thalasi.tverse.dto.PicklistResultDTO;
    import com.thalasi.tverse.model.SalesOrder;
    import com.thalasi.tverse.model.productVariant; // Your specific model naming
    import com.thalasi.tverse.repository.SalesOrderRepo;
    import com.thalasi.tverse.repository.ProductVariantRepo;
    import org.apache.poi.ss.usermodel.*;
    import org.apache.poi.xssf.usermodel.XSSFWorkbook;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;
    import org.springframework.web.multipart.MultipartFile;

    import java.io.BufferedReader;
    import java.io.IOException;
    import java.io.InputStreamReader;
    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.*;
    import java.util.stream.Collectors;

    @Service
    public class PicklistService {

        @Autowired
        private ProductVariantRepo variantRepo; // Corrected Repo Name
        @Autowired
        private MappingService mappingService;
        @Autowired
        private SalesOrderRepo orderRepo; // Corrected Repo Name

        // --- 1. INTERNAL HELPER CLASS (Updated with ALL Columns) ---
        private static class OrderRow {
            String orderId;
            String orderItemId; // NEW: Critical for Flipkart Uniqueness
            String shipmentId;  // NEW
            String sku;
            String fsn;         // NEW
            int qty;
            String city;
            String state;
            String pincode;
            String status;
            BigDecimal amount;
            String invoiceNumber; // NEW
            String trackingId;    // NEW
            LocalDateTime dispatchByDate;
            String asin;
            String channel;
            BigDecimal item_cost;
            BigDecimal product_payment;
            LocalDateTime orderDate;
            String warehouseCode;
            String buyerName;
            String batchId;
            String productTitle;




        }

        public String normalizeStatus(String rawStatus){
            if(rawStatus == null||rawStatus.isEmpty()){
                return "APPROVED";
            }
            String status=rawStatus.toUpperCase().trim();
            //Amazon Mapping
            if(status.equals("NEW")||status.equals("PENDING") || status.equals("CREATED")){
                return "APPROVED";
            }
            if(status.equals("APPROVED")||status.equals("PACKED")||status.equals("UPCOMING")||
                    status.equals("CANCELLED")){
                return status;
            }
            return "APPROVED";
        }

        public List<PicklistResultDTO> generatePicklist(MultipartFile file, String channel) throws IOException {

            String currentBatchId=UUID.randomUUID().toString();
            List<OrderRow> rawOrders;
            String filename = file.getOriginalFilename();

            // 1. EXTRACT DATA
            if (filename != null && filename.toLowerCase().endsWith(".csv")) {
                System.out.println("Processing CSV for Analytics: " + filename);
                rawOrders = parseCsvOrderFile(file,channel,currentBatchId);
            } else {
                System.out.println("Processing Excel for Analytics: " + filename);
                rawOrders = parseExcelOrderFile(file,channel,currentBatchId);
            }

            // 2. SAVE TO DATABASE (Analytics & History)
            saveOrdersToHistory(rawOrders, channel,currentBatchId);


            // 3. AGGREGATE FOR PICKLIST (Operations)
            Map<String, Integer> picklistMap = new HashMap<>();
            for (OrderRow row : rawOrders) {
                Map<String,Integer> resolvedItems=mappingService.resolveSku(row.sku,row.qty);
                for (Map.Entry<String, Integer> entry : resolvedItems.entrySet()) {
                    String realSku = entry.getKey();
                    int realQty = entry.getValue();
                    if(row.status == null || !row.status.equalsIgnoreCase("Cancelled")) {
                        picklistMap.merge(realSku, realQty, Integer::sum);
                    }
                }
            }

            // 4. GENERATE UI DATA
            List<PicklistResultDTO> picklist = new ArrayList<>();

            for (Map.Entry<String, Integer> entry : picklistMap.entrySet()) {
                String orderSku = entry.getKey();
                Integer orderQty = entry.getValue();

                Optional<productVariant> variantOpt = variantRepo.findBySku(orderSku);
                PicklistResultDTO item = new PicklistResultDTO();
                item.setSku(orderSku);
                item.setOrderQty(orderQty);
                item.setPicklistId(currentBatchId);

                if (variantOpt.isPresent()) {
                    productVariant v = variantOpt.get();
                    item.setProductName(v.getProduct().getName());
                    item.setImageUrl(v.getProduct().getImageUrl());

                    String varDetails = "";
                    if(v.getSize() != null) varDetails += "Size: " + v.getSize() + " ";
                    if(v.getColor() != null) varDetails += "Color: " + v.getColor();
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

            return picklist.stream()
                    .sorted(Comparator.comparing(PicklistResultDTO::getLocation, Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.toList());
        }

        // --- 5. SAVE ORDERS TO HISTORY (The Logic Engine) ---
        private void saveOrdersToHistory(List<OrderRow> rows, String channel,String batchId) {
            int savedCount = 0;

            for (OrderRow row : rows) {
                try {

                    // A. GENERATE UNIQUE KEY
                    String uniqueKey = "";

                    if (channel.equalsIgnoreCase("Flipkart")) {
                        // Flipkart Preference: Order Item ID
                        if (row.orderItemId != null && !row.orderItemId.isEmpty()) {
                            uniqueKey = row.orderItemId;
                        } else {
                            uniqueKey = row.orderId + "_" + row.sku; // Fallback
                        }
                    } else {
                        // Amazon/Others Preference: OrderID + SKU
                        uniqueKey = row.orderId + "_" + row.sku;
                    }

                    // B. IDEMPOTENCY CHECK (Prevent Duplicates)
                    if (orderRepo.existsByUniqueReferenceId(uniqueKey)) {
                        System.out.println("Already there");
                        continue; // Already saved, skip

                    }

                    // C. MAP TO ENTITY
                    SalesOrder order = new SalesOrder();
                    order.setUniqueReferenceId(uniqueKey);
                    order.setChannel(channel);
                    order.setOrderId(row.orderId);
                    order.setOrderItemId(row.orderItemId);
                    order.setShipmentId(row.shipmentId);
                    order.setPicklistId(batchId);
                    order.setProductName(row.productTitle);
                    order.setDispatchByDate(row.dispatchByDate);
                    // Product & Finance
                    order.setSku(row.sku);
                    order.setFsn(row.fsn);
                    order.setQuantity(row.qty);
                    order.setSellingPrice(row.amount);
                    order.setProductPayment(row.product_payment);
                    order.setInvoiceNumber(row.invoiceNumber);
                    order.setAsin(row.asin);
                    System.out.print("Order Asin "+order.getAsin()+" , ");
                    // Logistics
                    order.setOrderStatus(normalizeStatus(row.status));
                    order.setTrackingId(row.trackingId);

                    // Customer
                    order.setCustomerCity(row.city);
                    order.setCustomerState(row.state);
                    order.setCustomerName(row.buyerName);
                    order.setWarehouseCode(row.warehouseCode);
                    order.setPincode(row.pincode);

                    order.setOrderDate(LocalDateTime.now()); // Set import time

                    // Getting Data from catalog to orders tab

                    Optional<productVariant>masterVariantOpt=variantRepo.findBySku(row.sku);
                    if(masterVariantOpt.isPresent()){
                        productVariant masterData = masterVariantOpt.get();

                        // Fetching Image Link of product from product table
                        if(order.getImageUrl()==null||order.getImageUrl().isEmpty()){
                            String masterImage=masterData.getVariantImageUrl();
                            if(masterImage==null||masterImage.isEmpty()){
                                masterImage=masterData.getProduct().getImageUrl();
                            }
                            order.setImageUrl(masterImage);
                        }

                        // Fetching Item Cost from Product Table
                        if(order.getItemCost()==null||order.getItemCost().compareTo(BigDecimal.ZERO)==0){
                            order.setItemCost(masterData.getProcurementCost());
                        }

                        //
                        if(order.getProductName()==null||order.getProductName().isEmpty()){
                            order.setProductName(masterData.getProduct().getName());
                        }

                        updateInventory(row.sku,row.qty,"RESERVED");
                    }
                    orderRepo.save(order);
                    savedCount++;

                } catch (Exception e) {
                    System.out.println("Skipping analytics save for row: " + e.getMessage());
                }
            }
            System.out.println("✅ Analytics: Saved " + savedCount + " new orders from " + channel);
        }

        //Helper Function
        private Map<String,String> getHeaderMapping(String channel){
            Map<String,String>map =new HashMap<>();
            String Channel=channel.toLowerCase().trim();
            if(Channel.equals("amazon")){
                map.put("asin","ASIN");
                map.put("customer_city","Ship To City");
                map.put("customer_state","Ship To State");
                map.put("product_payment","Item Cost");
                map.put("order_date","Order Place Date");
                map.put("order_id","Order ID");
                map.put("order_status","Order Status");
                map.put("pincode","Ship To Zip Code");
                map.put("product_name","Item Title");
                map.put("quantity","Item Quantity");
                map.put("sku","SKU");
                map.put("tracking_id","Tracking ID");
                map.put("warehouse_code","Warehouse Code");
                map.put("customer_name","Ship To Name");
            } else if (Channel.equals("flipkart")) {
                map.put("customer_city","City");
                map.put("customer_state","State");
                map.put("dispatch_after_date","Dispatch After date");
                map.put("dispatch_by_date","Dispatch by date");
                map.put("fsn","FSN");
                map.put("invoice_number","Invoice No.");
                map.put("product_payment","Selling Price Per Item");
                map.put("listing_id","Listing Id");
                map.put("order_date","Ordered On");
                map.put("order_id","Order Id");
                map.put("order_item_id","ORDER ITEM ID");
                map.put("order_status","Order State");
                map.put("pincode","PIN Code");
                map.put("product_name","Product");
                map.put("quantity","Quantity");
                map.put("selling_price","Price inc. FKMP Contribution & Subsidy");
                map.put("shipment_id","Shipment ID");
                map.put("sku","SKU");
                map.put("tracking_id","Tracking ID");
                map.put("warehouse_code","Order Type");
                map.put("customer_name","Buyer name");
            }
            else if(Channel.equals("myntra")){
                map.put("order_date","Created On");
                map.put("shipment_id","Store Packet ID");
                map.put("order_item_id","Order_release_id");
                map.put("order_id","Order id");
                map.put("order_type","Type");
                map.put("listing_id","Myntra SKU code");
                map.put("sku","Seller_sku_code");
                map.put("selling_price","Selling value");
                map.put("customer_city","Destination City");
                map.put("customer_state","Destination state");
                map.put("pincode","Destination pincode");
                map.put("tracking_id","Tracking_id");
            }
            else if(Channel.equals("meesho")){
                map.put("order_date","Order Date");
                map.put("warehouse_code","Order source");
                map.put("order_id","Sub Order No");
                map.put("listing_id","Catalog ID");
                map.put("selling_price","Supplier Discounted Price (Incl GST and Commision)");
                map.put("quantity","Quantity");
                map.put("customer_state","Customer State");
                map.put("tracking_id","Packet Id");
                map.put("sku","SKU");
                map.put("meesho_size","Size");

            }
            else{
                System.out.println("Unknown Channel: " + channel);
            }
            return map;
        }

        // --- 6. PARSER: CSV (Updated for Extra Columns) ---
        private List<OrderRow> parseCsvOrderFile(MultipartFile file,String channel,String batchId)throws IOException{
            List<OrderRow> list = new ArrayList<>();
            String platform=channel.toUpperCase().trim();
            Map<String,String> config = getHeaderMapping(channel);
            Map<String,Integer> indices=new HashMap<>();

            try(BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))){
                String line;
                while((line = br.readLine())!=null){
                    if(line.trim().isEmpty()) continue;
                    String[] cols = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                    //------ Phase 1 Mapping the Row Discovery and fetching index of all rows required in indices

                    if(indices.isEmpty()){
                        System.out.println("--- DEBUG: STARTING HEADER SCAN ---"); // <--- ADD THIS

                        for(int i=0;i<cols.length;i++){
                            String rawHeader = cols[i];
                            if (rawHeader.startsWith("\uFEFF")) {
                                rawHeader = rawHeader.substring(1);
                            }
                            String fileHeader = rawHeader.toLowerCase().trim().replace("\"", "");
                            System.out.println("Index " + i + " | File Header: [" + fileHeader + "]");
                            for(Map.Entry<String,String> entry: config.entrySet()){
                                System.out.println("Compare Check Mapping "+":"+(entry.getValue().toLowerCase().trim())+"| config: "+fileHeader);
                                //problem area checking random value with header column
                                if(fileHeader.equals(entry.getValue().toLowerCase().trim())){
                                    indices.put(entry.getKey(), i);
                                    System.out.println("   ✅ MATCHED! " + fileHeader + " -> " + entry.getKey());
                                }
                            }
                        }
                        // Safety Check: Did we actually find the SKU column?
                        if(!indices.containsKey("sku")){
                            System.out.println("Critical Error:Could not find 'SKU' column. Check mapping");
                        }
                        System.out.println("--- DEBUG: MAP RESULT: " + indices.toString());
                        continue;
                    }

                    //-------- Phase 2: Data Extraction (Run for every order row) ----

                    if(indices.containsKey("sku") && cols.length > indices.get("sku")){
                        OrderRow row = new OrderRow();

                        // 1. Get Mandatory SKU
                        int skuIndex = indices.get("sku");

                        row.sku = clean(cols[skuIndex]);
                        if(indices.containsKey("meesho_size") && channel.equalsIgnoreCase("meesho")){
                            int meeshoSize=indices.get("meesho_size");
                            row.sku=row.sku+"_"+clean(cols[meeshoSize]);
                        }
                        row.batchId = batchId;

                        // Skip if this is just a repeated header or empty line
                        if(row.sku.isEmpty() || row.sku.equalsIgnoreCase(config.get("sku"))) continue;

                        // 2. Get Dynamic Fields (Using getSafeVal for safety)
                        if(indices.containsKey("order_id"))
                            row.orderId = getSafeVal(cols, indices.get("order_id"));

                        if(indices.containsKey("order_item_id"))
                            row.orderItemId = getSafeVal(cols, indices.get("order_item_id")).replace("'","");

                        if(indices.containsKey("product_name"))
                            row.productTitle = getSafeVal(cols, indices.get("product_name"));

                        if(indices.containsKey("shipment_id"))
                            row.shipmentId = getSafeVal(cols, indices.get("shipment_id"));

                        // This was the one causing the crash (Index 24)
                        if(indices.containsKey("customer_city"))
                            row.city = getSafeVal(cols, indices.get("customer_city"));

                        if(indices.containsKey("asin")) {
                            row.asin = getSafeVal(cols, indices.get("asin"));
                            System.out.print("Asin " + row.asin + " ");
                        }

                        if(indices.containsKey("channel"))
                            row.channel = getSafeVal(cols, indices.get("channel"));

                        if(indices.containsKey("customer_state"))
                            row.state = getSafeVal(cols, indices.get("customer_state"));

                        if(indices.containsKey("fsn"))
                            row.fsn = getSafeVal(cols, indices.get("fsn"));

                        if(indices.containsKey("invoice_number"))
                            row.invoiceNumber = getSafeVal(cols, indices.get("invoice_number"));

                        if(indices.containsKey("product_payment")) {
                            row.product_payment = parseCurrency(getSafeVal(cols, indices.get("product_payment")));
                        }

                        // Date Parsing
                        if(indices.containsKey("order_date")) {
                            try {
                                String dateStr = getSafeVal(cols, indices.get("order_date"));
                                // Try parsing, fallback to NOW
                                // Note: You might need a formatter here if the string isn't ISO format
                                // row.orderDate = LocalDateTime.parse(dateStr);
                                row.orderDate = LocalDateTime.now();
                                row.dispatchByDate = LocalDateTime.now().plusHours(24);
                            } catch(Exception e) {
                                row.orderDate = LocalDateTime.now();
                                row.dispatchByDate = LocalDateTime.now().plusHours(24);
                            }
                        } else {
                            row.orderDate = LocalDateTime.now();
                            row.dispatchByDate = LocalDateTime.now().plusHours(24);
                        }

                        if(indices.containsKey("order_status"))
                            row.status = getSafeVal(cols, indices.get("order_status"));

                        if(indices.containsKey("pincode"))
                            row.pincode = getSafeVal(cols, indices.get("pincode"));

                        // Numeric Parsing
                        if(indices.containsKey("quantity")) {
                            try {
                                row.qty = Integer.parseInt(getSafeVal(cols, indices.get("quantity")));

                            } catch(Exception e) { row.qty = 1; }
                        }else{
                            if(channel.equalsIgnoreCase("myntra")){
                                row.qty=1;
                            }
                        }

                        if(indices.containsKey("selling_price")) {
                            try {
                                row.amount = parseCurrency(getSafeVal(cols, indices.get("selling_price")));
                            } catch(Exception e) {
                                row.amount = BigDecimal.valueOf(0.00);
                                System.out.println("Error Occurred in selling price: " + e + " ");
                            }
                        }

                        if(indices.containsKey("tracking_id"))
                            row.trackingId = getSafeVal(cols, indices.get("tracking_id"));

                        if(indices.containsKey("warehouse_code")) {
                            try {
                                row.warehouseCode = getSafeVal(cols, indices.get("warehouse_code"));
                            } catch (Exception e) {
                                System.out.println("Error Occurred in warehouse code: " + e + " ");
                            }
                        }

                        if(indices.containsKey("customer_name")) {
                            try {
                                row.buyerName = getSafeVal(cols, indices.get("customer_name"));
                            } catch (Exception e) {
                                System.out.println("Error Occurred in customer name: " + e + " ");
                            }
                        }

                        list.add(row);
                    }
                }
            }

            return list;
        }
        // --- 7. PARSER: EXCEL (Dynamic & Robust) ---
        private List<OrderRow> parseExcelOrderFile(MultipartFile file, String channel,String batchId) throws IOException {
            List<OrderRow> list = new ArrayList<>();

            // 1. Load Dictionary & Setup
            Map<String, String> config = getHeaderMapping(channel);
            Map<String, Integer> indices = new HashMap<>();
            DataFormatter formatter = new DataFormatter(); // handles Excel cell formatting

            try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
                Sheet sheet = workbook.getSheetAt(0);

                for (Row row : sheet) {
                    // --- PHASE 1: HEADER DISCOVERY (Row 0) ---
                    if (row.getRowNum() == 0) {
                        for (Cell cell : row) {
                            String fileHeader = formatter.formatCellValue(cell).toLowerCase().trim();

                            // Check against our Dictionary
                            for (Map.Entry<String, String> entry : config.entrySet()) {
                                if (fileHeader.equals(entry.getValue().toLowerCase().trim())) {
                                    indices.put(entry.getKey(), cell.getColumnIndex());
                                }
                            }
                        }

                        // Critical Check
                        if (!indices.containsKey("sku")) {
                            System.out.println("❌ Critical Error (Excel): Could not find 'SKU' column for " + channel);
                        }
                        continue; // Done with headers
                    }

                    // --- PHASE 2: DATA EXTRACTION ---
                    // Only proceed if we found the SKU column
                    if (indices.containsKey("sku")) {
                        Cell skuCell = row.getCell(indices.get("sku"));
                        String skuVal = formatter.formatCellValue(skuCell).trim();

                        // Skip empty rows or repeated headers
                        if (skuVal.isEmpty() || skuVal.equalsIgnoreCase(config.get("sku"))) continue;

                        OrderRow orderRow = new OrderRow();
                        orderRow.sku = skuVal;
                        orderRow.channel = channel;
                        orderRow.batchId=batchId;

                        // --- Some Custom Channel Filters
                        if(indices.containsKey("meesho_size") && channel.equalsIgnoreCase("meesho")){
                            Cell meeshoSize=row.getCell(indices.get("meesho_size"));
                            orderRow.sku=orderRow.sku+"_"+formatter.formatCellValue(meeshoSize).trim();
                        }

                        // --- String Fields (Check map -> Get Cell -> Format) ---
                        if (indices.containsKey("order_id")) orderRow.orderId = getVal(row, indices.get("order_id"), formatter);
                        if (indices.containsKey("order_item_id")) orderRow.orderItemId = getVal(row, indices.get("order_item_id"), formatter);
                        if (indices.containsKey("shipment_id")) orderRow.shipmentId = getVal(row, indices.get("shipment_id"), formatter);
                        if (indices.containsKey("city")) orderRow.city = getVal(row, indices.get("city"), formatter);
                        if (indices.containsKey("state")) orderRow.state = getVal(row, indices.get("state"), formatter);
                        if (indices.containsKey("pincode")) orderRow.pincode = getVal(row, indices.get("pincode"), formatter);
                        if (indices.containsKey("status")) orderRow.status = getVal(row, indices.get("status"), formatter);
                        if (indices.containsKey("tracking_id")) orderRow.trackingId = getVal(row, indices.get("tracking_id"), formatter);
                        if (indices.containsKey("invoice_number")) orderRow.invoiceNumber = getVal(row, indices.get("invoice_number"), formatter);
                        if (indices.containsKey("warehouse_code")) orderRow.warehouseCode = getVal(row, indices.get("warehouse_code"), formatter);
                        if (indices.containsKey("customer_name")) orderRow.buyerName = getVal(row, indices.get("customer_name"), formatter);

                        // FSN / ASIN Logic
                        if (indices.containsKey("fsn")) orderRow.fsn = getVal(row, indices.get("fsn"), formatter);
                        else if (indices.containsKey("asin")) orderRow.asin = getVal(row, indices.get("asin"), formatter);

                        // --- Numeric Fields ---
                        if (indices.containsKey("quantity")) {
                            try {
                                String q = getVal(row, indices.get("quantity"), formatter);
                                orderRow.qty = (int) Double.parseDouble(q); // Handles "1.0"

                            } catch (Exception e) { orderRow.qty = 1; }
                        }
                        else{
                            if(channel.equalsIgnoreCase("myntra")){
                                orderRow.qty=1;
                            }
                        }

                        if (indices.containsKey("selling_price")) {
                            try {
                                String amt = getVal(row, indices.get("selling_price"), formatter);
                                orderRow.amount = parseCurrency(amt);
                            } catch (Exception e) { orderRow.amount = BigDecimal.valueOf(0.0); }
                        } else if (indices.containsKey("product_payment")) {
                            try {
                                String amt = getVal(row, indices.get("product_payment"), formatter);
                                orderRow.amount = BigDecimal.valueOf(Double.parseDouble(amt));
                            } catch (Exception e) { orderRow.amount = BigDecimal.valueOf(0.0); }
                        }

                        // --- Date Parsing ---
                        // For now, default to NOW to prevent crashes on format mismatch
                        orderRow.orderDate = LocalDateTime.now();

                        list.add(orderRow);
                    }
                }
            }
            return list;
        }

        // Helper to get formatted string from Excel cell safely
        private String getVal(Row row, int index, DataFormatter formatter) {
            Cell cell = row.getCell(index);
            if (cell == null) return "";

            // 1. Check if it is a Number (like Tracking ID or Phone)
            if (cell.getCellType() == CellType.NUMERIC) {
                // Convert to BigDecimal to prevent "E+11" notation
                // toPlainString() forces it to be "366075123456" instead of scientific
                return new BigDecimal(String.valueOf(cell.getNumericCellValue())).toPlainString().replace(".0", "");
            }

            // 2. Otherwise, read as text
            return formatter.formatCellValue(cell).trim();
        }

        private String clean(String s) {
            return s.replaceAll("\"", "").trim();
        }
        // Helper to remove '₹', '$', ',' and whitespace
        private BigDecimal parseCurrency(String value) {
            if (value == null || value.isEmpty()) {
                return BigDecimal.ZERO;
            }
            try {
                // Regex explanation: Replace anything that is NOT a digit (0-9) or a dot (.) with empty string
                String cleanValue = value.replaceAll("[^0-9.]", "");
                return new BigDecimal(cleanValue);
            } catch (Exception e) {
                return BigDecimal.ZERO;
            }
        }

        // --- Delete Orders based on picklistId

            public String deletePicklistBatch(String picklistId){
            long deletedCount=orderRepo.deleteByPicklistId(picklistId);
            if(picklistId==null||picklistId.isEmpty()){
                return "Invalid Batch ID";
            }
            if(deletedCount>0){
                return "Successfully deleted "+deletedCount+" orders from history.";
            }
            else{
                return "No orders found for this batch (or already deleted).";
            }


            }
        // Safe Extraction Helper
        private String getSafeVal(String[] cols, Integer index) {
            if (index == null || index >= cols.length) {
                return ""; // Return empty string if index is out of bounds
            }
            return clean(cols[index]);
        }
        private void updateInventory(String sku,int qty,String action){
            productVariant v = variantRepo.findBySku(sku).orElse(null);

            if(v == null)return; //Skip if Sku not found

            if(action.equals("RESERVE")){
                v.setStockCommitted(v.getStockCommitted() + qty);
            }
            else if(action.equals("DEDUCT")){// Shipped
                v.setStockOnHand(v.getStockOnHand()-qty);
                v.setStockCommitted(v.getStockCommitted()-qty);
            }
            else if(action.equals("RELEASE")){// Cancel
                v.setStockCommitted(v.getStockCommitted()-1);
            }
            variantRepo.save(v);
        }

    }