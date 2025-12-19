package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.StockAdjustmentDTO;
import com.thalasi.tverse.service.DashboardService; // Import this
import com.thalasi.tverse.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private DashboardService dashboardService; // Inject the Dashboard Service

    // 1. Manual Stock Adjustment
    @PostMapping("/adjust")
    public ResponseEntity<String> adjustStock(@RequestBody StockAdjustmentDTO request) {
        try {
            inventoryService.adjustStock(request);
            return ResponseEntity.ok("Stock updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 2. Bulk Stock Adjustment (Excel)
    @PostMapping("/bulk-adjust")
    public ResponseEntity<String> bulkAdjustStock(@RequestParam("file") MultipartFile file) {
        try {
            String result = inventoryService.processBulkStockFile(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Bulk Process Error: " + e.getMessage());
        }
    }

    // --- 3. NEW: DASHBOARD ANALYTICS ENDPOINT ---
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            // Calls the logic we wrote in DashboardService to calculate alerts & value
            return ResponseEntity.ok(dashboardService.getDashboardStats());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching stats: " + e.getMessage());
        }
    }
}