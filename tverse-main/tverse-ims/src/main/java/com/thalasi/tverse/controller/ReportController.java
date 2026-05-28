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
            HttpServletResponse response) throws IOException {

        // 1. Generate a clean timestamp for the filename (e.g., 2026-05-28_14-30-00)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

        // 2. Set browser headers to trigger a file download
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=" + type.toLowerCase() + "_report_" + timestamp + ".csv");

        // 3. Route to the correct service based on the requested 'type'
        switch (type.toUpperCase()) {
            case "CATALOG_TEMPLATE":
                reportService.generateCatalogListingTemplate(response.getWriter(), category);
                break;
            // We will add the logic for TOTAL_ORDERS, ABC_CLASSIFICATION, etc., here later!
            default:
                response.getWriter().write("Error: Unknown report type requested.");
        }
    }
}