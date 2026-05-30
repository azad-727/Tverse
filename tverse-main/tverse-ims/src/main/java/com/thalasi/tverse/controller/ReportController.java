package com.thalasi.tverse.controller;

import com.thalasi.tverse.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/download")
    public void downloadReport(
            @RequestParam String type,
            @RequestParam(defaultValue = "ALL") String category,
            @RequestParam(defaultValue = "30") String days,       // Fixed: Binds ?days= from frontend
            @RequestParam(defaultValue = "ALL") String channel,
            @RequestParam(defaultValue = "CHILD") String skuLevel,
            HttpServletResponse response) throws IOException {

        System.out.println("REPORT HUB ACCESS -> Type: " + type + " | SKU Level Received: [" + skuLevel + "]");


        // 1. Generate a clean timestamp for the filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

        // 2. Set browser headers to trigger a file download
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=" + type.toLowerCase() + "_report_" + timestamp + ".csv");

        // 3. Route to the correct service based on the requested 'type'
        switch (type.toUpperCase()) {
            case "CATALOG_TEMPLATE":
                reportService.generateCatalogListingTemplate(response.getWriter(), category);
                break;
            case "ALL_STOCK":
                reportService.generateAllStockInventoryReport(response.getWriter());
                break;
            case "TOTAL_DISPATCHED":
                // Reads request parameters sent natively from React state values
                reportService.generateDispatchedOrdersReport(response.getWriter(),days,channel);
                break;
            case "TOTAL_RETURNS":
                reportService.generateScanBasedReturnReport(response.getWriter(),
                        days,channel);
                break;
            case "TOTAL_CANCELLED":
                reportService.generateCancelledOrdersReport(response.getWriter(),
                        days, channel);
                break;
            case "DISPATCH_LOGS":
                reportService.generateRawDispatchLogs(response.getWriter(), days);
                break;
            case "ABC_CLASSIFICATION":
                reportService.generateAbcClassificationReport(response.getWriter(),skuLevel);
                break;
            case "VARIANT_LIFECYCLE":
                reportService.generateVariantLifecycleReport(response.getWriter(), days, category);
                break;
            case "DEAD_STOCK":
                reportService.generateDeadStockTargetsReport(response.getWriter(), days, category);
                break;
            case "PROCUREMENT":
                reportService.generateProcurementActionReport(response.getWriter());
                break;
            default:
                response.getWriter().write("Error: Unknown report request payload context mapping error.");
        }
    }
}