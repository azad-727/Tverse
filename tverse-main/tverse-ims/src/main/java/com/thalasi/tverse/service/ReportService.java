package com.thalasi.tverse.service;

import com.thalasi.tverse.model.DailyDispatch;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.model.SalesReturn;
import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.Printer;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {

    @Autowired
    private ProductVariantRepo productVariantRepo;
    @Autowired
    private DailyDispatchRepo dispatchRepo;
    @Autowired
    private SalesReturnRepo salesReturnRepo;
    @Autowired
    private SalesOrderRepo salesOrderRepo;
    @Autowired
    private LiquidationService liquidationService;
    @Autowired
    private DashboardSnapshotRepository snapshotRepository;


    public void generateCatalogListingTemplate(PrintWriter writer, String categoryFilter) throws IOException {
        List<productVariant> variants = productVariantRepo.findAll();

        String[] headers = {
                "Variant ID", "SKU", "Parent Product Name", "Category",
                "Size", "Color", "Regular Price", "Sale Price",
                "Procurement Cost", "Stock On Hand", "Warehouse Location"
        };

        try (CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {

            for (productVariant variant : variants) {
                String parentName = variant.getProduct() != null ? variant.getProduct().getName() : "N/A";
                String categoryName = (variant.getProduct() != null && variant.getProduct().getCategory() != null)
                        ? variant.getProduct().getCategory().getName() : "Uncategorized";

                // Filter logic (if user selected a specific category in React)
                if (!categoryFilter.equals("ALL") && !categoryName.equalsIgnoreCase(categoryFilter)) {
                    continue;
                }

                // 4. Print the row
                csvPrinter.printRecord(
                        variant.getId(),
                        variant.getSku(),
                        parentName,
                        categoryName,
                        variant.getSize() != null ? variant.getSize() : "",
                        variant.getColor() != null ? variant.getColor() : "",
                        variant.getRegularPrice(),
                        variant.getSalePrice(),
                        variant.getProcurementCost(),
                        variant.getStockOnHand(),
                        variant.getWarehouseLocation() != null ? variant.getWarehouseLocation() : ""
                );
            }
        }

    }

    public void generateAllStockInventoryReport(PrintWriter writer) throws IOException {
        List<productVariant> variants = productVariantRepo.findAll();

        String[] headers = {
                "Variant ID", "Parent ID", "Parent Product Name", "Category",
                "Variant SKU", "Size", "Color",
                "Stock on Hand", "Stock Committed", "Warehouse Location",
                "Regular Price", "Sale Price", "Procurement Cost", "Total Stock Value"
        };
        try (CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {

            for (productVariant variant : variants) {
                // Safely extract relational data
                Long parentId = variant.getProduct() != null ? variant.getProduct().getId() : null;
                String parentName = variant.getProduct() != null ? variant.getProduct().getName() : "N/A";
                String categoryName = (variant.getProduct() != null && variant.getProduct().getCategory() != null)
                        ? variant.getProduct().getCategory().getName() : "Uncategorized";

                // Calculate the total valuation of this specific SKU based on procurement cost
                double stockValue = 0.0;
                if (variant.getProcurementCost() != null) {
                    stockValue = variant.getProcurementCost()
                            .multiply(java.math.BigDecimal.valueOf(variant.getStockOnHand()))
                            .doubleValue();
                }

                // Print the row
                csvPrinter.printRecord(
                        variant.getId(),
                        parentId,
                        parentName,
                        categoryName,
                        variant.getSku(),
                        variant.getSize() != null ? variant.getSize() : "",
                        variant.getColor() != null ? variant.getColor() : "",
                        variant.getStockOnHand(),
                        // Assuming you have a stockCommitted field. If not, replace with 0 or remove.
                        variant.getStockCommitted(),
                        variant.getWarehouseLocation() != null ? variant.getWarehouseLocation() : "",
                        variant.getRegularPrice(),
                        variant.getSalePrice(),
                        variant.getProcurementCost(),
                        stockValue // Calculated column for the accounting team!
                );
            }
        }
    }

    private LocalDateTime calculateStartDate(String days) {
        try {
            int numericDays = Integer.parseInt(days);
            return LocalDateTime.now().minusDays(numericDays);
        } catch (NumberFormatException e) {
            return LocalDateTime.now().minusDays(30); // Dynamic safe fallback
        }
    }

    public void generateDispatchedOrdersReport(PrintWriter writer, String days, String channelFilter) throws IOException {
        LocalDateTime startDate = calculateStartDate(days);
        List<SalesOrder> orders = salesOrderRepo.findByStatusAndDateAfter("SHIPPED", startDate);

        String[] headers = getChannelHeaders(channelFilter);
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (SalesOrder order : orders) {
                if (!channelFilter.equalsIgnoreCase("ALL") && !order.getChannel().equalsIgnoreCase(channelFilter)) {
                    continue;
                }
                printChannelRecord(printer, order, channelFilter);
            }
        }
    }

    public void generateCancelledOrdersReport(PrintWriter writer, String days, String channelFilter) throws IOException {
        LocalDateTime startDate = calculateStartDate(days);
        List<SalesOrder> cancelledOrders = salesOrderRepo.findByStatusAndDateAfter("CANCELLED", startDate);

        String[] headers = getChannelHeaders(channelFilter);
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (SalesOrder order : cancelledOrders) {
                if (!channelFilter.equalsIgnoreCase("ALL") && !order.getChannel().equalsIgnoreCase(channelFilter)) {
                    continue;
                }
                printChannelRecord(printer, order, channelFilter);
            }
        }
    }

    public void generateScanBasedReturnReport(PrintWriter writer, String days, String channelFilter) throws IOException {

        LocalDateTime startDate = calculateStartDate(days);
        List<SalesReturn> salesReturns = salesReturnRepo.findByReturnDateAfter(startDate);
        String[] headers = {"Return ID", "Scan Date", "Channel", "Order ID", "Tracking ID", "SKU", "Qty Received", "Type", "Main Reason", "QC Status", "Action", "Selling Price", "Est Loss"};

        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (SalesReturn scan : salesReturns) {
                if (!channelFilter.equalsIgnoreCase("ALL") && !scan.getReturnChannel().equalsIgnoreCase(channelFilter)) {
                    continue;
                }

                // Cross reference pricing parameters automatically
                Optional<SalesOrder> originalOrder = salesOrderRepo.findByOrderIdAndSku(scan.getChannelOrderId(), scan.getSku());
                java.math.BigDecimal price = originalOrder.map(SalesOrder::getSellingPrice).orElse(java.math.BigDecimal.ZERO);
                java.math.BigDecimal loss = price.multiply(java.math.BigDecimal.valueOf(scan.getQty()));

                printer.printRecord(
                        scan.getId(), scan.getReturnDate(), scan.getReturnChannel(), scan.getChannelOrderId(),
                        scan.getTrackingId(), scan.getSku(), scan.getQty(), scan.getReturnType(),
                        scan.getReturnMainReason(), scan.getQcStatus(), scan.getActionTaken(), price, loss
                );
            }
        }
    }


    public void generateRawDispatchLogs(PrintWriter writer, String days) throws IOException {
        List<DailyDispatch> logs = dispatchRepo.findByScanTimeAfter(calculateStartDate(days));
        String[] headers = {"Log ID", "Scan Time", "Order ID", "SKU", "Channel", "Courier", "Staff Handled", "V-Barcode"};
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (DailyDispatch log : logs) {
                printer.printRecord(log.getId(), log.getScanTime(), log.getOrderId(), log.getSku(), log.getChannel(), log.getCourierPartner(), log.getStaffName(), log.getVerticalBarcode());
            }
        }
    }

    private String[] getChannelHeaders(String channel) {
        switch (channel.toUpperCase()) {
            case "FLIPKART":
                return new String[]{
                        "Ordered Date", "Shipment ID", "ORDER ITEM ID", "Order Id",
                        "Hsn Code", "Order Type", "FSN", "SKU", "Invoice No.",
                        "Invoice Amt", "Selling Price", "Qty", "City", "State",
                        "Pincode", "Tracking Id", "Phone Number"
                };

            case "AMAZON":
                return new String[]{
                        "date/time", "Order Id", "Hsn Code", "Asin", "SKU",
                        "product sales", "quantity", "order city", "order state",
                        "order postal", "Tracking Id"
                };

            case "COCOBLU":
            case "AMAZON - COCOBLU":
                return new String[]{
                        "Order Place Date", "Warehouse Code", "Order Id", "Hsn Code",
                        "ASIN", "SKU", "Invoice Id", "Item Cost", "Item Quantity",
                        "Ship To City", "Ship To State", "Ship To ZIP Code"
                };

            default: // "ALL" - Unified Master Column Layout Matrix
                return new String[]{
                        "Order Date", "Warehouse Code", "Shipment ID", "ORDER ITEM ID",
                        "Order Id", "Hsn Code", "Order Type", "Product Id", "Product Sku",
                        "Invoice No.", "Item Cost", "Selling Price", "Qty", "City",
                        "State", "Pincode", "Tracking Id", "Phone Number"
                };
        }
    }

    private void printChannelRecord(CSVPrinter printer, SalesOrder order, String channel) throws IOException {
        switch (channel.toUpperCase()) {
            case "FLIPKART":
                printer.printRecord(
                        order.getOrderDate(),
                        order.getShipmentId() != null ? order.getShipmentId() : "",
                        order.getOrderItemId() != null ? order.getOrderItemId() : "",
                        order.getOrderId() != null ? order.getOrderId() : "",
                        "", // Hsn Code placeholder
                        "", // Order Type placeholder
                        order.getFsn() != null ? order.getFsn() : "",
                        order.getSku() != null ? order.getSku() : "",
                        order.getInvoiceNumber() != null ? order.getInvoiceNumber() : "",
                        order.getProductPayment(), // Invoice Amt mapping
                        order.getSellingPrice(),
                        order.getQuantity(),
                        order.getCustomerCity() != null ? order.getCustomerCity() : "",
                        order.getCustomerState() != null ? order.getCustomerState() : "",
                        order.getPincode() != null ? order.getPincode() : "",
                        order.getTrackingId() != null ? order.getTrackingId() : "",
                        ""  // Phone Number placeholder
                );
                break;

            case "AMAZON":
                printer.printRecord(
                        order.getOrderDate(),
                        order.getOrderId() != null ? order.getOrderId() : "",
                        "", // Hsn Code placeholder
                        order.getAsin() != null ? order.getAsin() : "",
                        order.getSku() != null ? order.getSku() : "",
                        order.getSellingPrice(), // product sales header mapping
                        order.getQuantity(),     // quantity header mapping
                        order.getCustomerCity() != null ? order.getCustomerCity() : "",
                        order.getCustomerState() != null ? order.getCustomerState() : "",
                        order.getPincode() != null ? order.getPincode() : "",
                        order.getTrackingId() != null ? order.getTrackingId() : ""
                );
                break;

            case "COCOBLU":
            case "AMAZON - COCOBLU":
                printer.printRecord(
                        order.getOrderDate(),
                        order.getWarehouseCode() != null ? order.getWarehouseCode() : "",
                        order.getOrderId() != null ? order.getOrderId() : "",
                        "", // Hsn Code placeholder
                        order.getAsin() != null ? order.getAsin() : "",
                        order.getSku() != null ? order.getSku() : "",
                        order.getInvoiceNumber() != null ? order.getInvoiceNumber() : "", // Invoice Id mapping
                        order.getItemCost(),
                        order.getQuantity(), // Item Quantity header mapping
                        order.getCustomerCity() != null ? order.getCustomerCity() : "",
                        order.getCustomerState() != null ? order.getCustomerState() : "",
                        order.getPincode() != null ? order.getPincode() : ""
                );
                break;

            default: // Master Column Complete Dump
                printer.printRecord(
                        order.getOrderDate(),
                        order.getWarehouseCode() != null ? order.getWarehouseCode() : "",
                        order.getShipmentId() != null ? order.getShipmentId() : "",
                        order.getOrderItemId() != null ? order.getOrderItemId() : "",
                        order.getOrderId() != null ? order.getOrderId() : "",
                        "", // Hsn Code
                        "", // Order Type
                        order.getFsn() != null ? order.getFsn() : (order.getAsin() != null ? order.getAsin() : ""), // Product Id resolution
                        order.getSku() != null ? order.getSku() : "",
                        order.getInvoiceNumber() != null ? order.getInvoiceNumber() : "",
                        order.getItemCost(),
                        order.getSellingPrice(),
                        order.getQuantity(),
                        order.getCustomerCity() != null ? order.getCustomerCity() : "",
                        order.getCustomerState() != null ? order.getCustomerState() : "",
                        order.getPincode() != null ? order.getPincode() : "",
                        order.getTrackingId() != null ? order.getTrackingId() : "",
                        ""  // Phone Number
                );
                break;
        }


    }
    // --- ANALYTICS - ABC REPORT DOWNLOADER
    public void generateAbcClassificationReport(PrintWriter writer,String skuLevel) throws IOException{

        String metricType="PARENT".equalsIgnoreCase(skuLevel)?"PARENT_ABC_ANALYSIS":"ABC_ANALYSIS";

        List<com.thalasi.tverse.model.DailyDashboardSnapshot> snapshots = snapshotRepository.findLatestSnapshotsByMetricType("ABC_ANALYSIS");
        String skuHeader="PARENT".equalsIgnoreCase(skuLevel)?"PARENT SKU":"CHILD SKU";
        String[] headers={skuHeader,"ABC Category","Total Revenue","Revenue Contribution %"};
        try(CSVPrinter printer = new CSVPrinter(writer,CSVFormat.DEFAULT.builder().setHeader(headers).build())){
            for (com.thalasi.tverse.model.DailyDashboardSnapshot snap : snapshots) {
                // Enterprise tip: Parse fields natively without full Jackson setups if layout is fixed
                String json = snap.getMetricValue();
                String category = extractJsonValue(json, "category");
                String revenue = extractJsonValue(json, "revenue");
                String contribution = extractJsonValue(json, "contributionPct");

                printer.printRecord(snap.getMetricKey(), category, revenue, contribution);
            }
        }
    }

    // ------ VARIANT LIFECYCLE csv Download
    public void generateVariantLifecycleReport(PrintWriter writer,String days,String categoryFilter) throws IOException{

        int numericDays=Integer.parseInt(days);
        List<com.thalasi.tverse.dto.VariantPerformanceDTO> performances=liquidationService.getVariantLifecycle(numericDays,categoryFilter);
        String[] headers = {"SKU", "Category", "Units Sold", "Total Revenue Generated", "Lifecycle Status"};
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (com.thalasi.tverse.dto.VariantPerformanceDTO dto : performances) {
                printer.printRecord(dto.sku, dto.category, dto.unitsSold, dto.revenue, dto.status);
            }
        }
    }

//----- DeadStock Download
public void generateDeadStockTargetsReport(PrintWriter writer, String days, String categoryFilter) throws IOException {
    int numericDays = Integer.parseInt(days);
    List<com.thalasi.tverse.dto.VariantPerformanceDTO> performances =
            liquidationService.getVariantLifecycle(numericDays, categoryFilter);

    String[] headers = {"SKU", "Category", "Days Without A Single Sale", "Current Physical Stock", "Unit Procurement Cost", "Frozen Capital Exposure"};
    try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
        for (com.thalasi.tverse.dto.VariantPerformanceDTO dto : performances) {
            // Isolate strictly non-performing SKUs
            if ("DEAD_STOCK".equalsIgnoreCase(dto.status)) {
                // Fetch physical stock parameters to check if capital is truly stuck on shelves
                Optional<com.thalasi.tverse.model.productVariant> variantOpt = productVariantRepo.findBySku(dto.sku);
                int physicalStock = variantOpt.map(v -> v.getStockOnHand()).orElse(0);

                // If we have zero sales but also zero stock, it's not hurting our cash flow; skip it!
                if (physicalStock <= 0) continue;

                java.math.BigDecimal unitCost = variantOpt.map(v -> v.getProcurementCost()).orElse(java.math.BigDecimal.ZERO);
                java.math.BigDecimal frozenExposure = unitCost.multiply(java.math.BigDecimal.valueOf(physicalStock));

                printer.printRecord(dto.sku, dto.category, days + " Days", physicalStock, unitCost, frozenExposure);
                }
            }
        }
    }
    public void generateProcurementActionReport(PrintWriter writer) throws IOException {
        List<com.thalasi.tverse.model.DailyDashboardSnapshot> snapshots =
                snapshotRepository.findLatestSnapshotsByMetricType("STOCKOUT_PREDICTOR");

        String[] headers = {"SKU", "Daily Sales Velocity (Units/Day)", "Total Units Sold (30D)", "Days of Inventory Left (DOI)", "Urgency Action Alert Status"};
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (com.thalasi.tverse.model.DailyDashboardSnapshot snap : snapshots) {
                String json = snap.getMetricValue();
                String doi = extractJsonValue(json, "doi");
                String status = extractJsonValue(json, "status");
                String velocity = extractJsonValue(json, "velocity");
                String unitsSold = extractJsonValue(json, "units_sold");

                printer.printRecord(snap.getMetricKey(), velocity, unitsSold, doi, status);
            }
        }
    }

    private String extractJsonValue(String json, String key) {
        try {
            if (json == null || !json.contains(key)) return "";
            String[] parts = json.split("\"" + key + "\":");
            if (parts.length < 2) return "";
            String val = parts[1].split("[,}]")[0].trim();
            return val.replace("\"", "");
        } catch (Exception e) {
            return "";
        }
    }




}
