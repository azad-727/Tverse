package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.StockAdjustmentDTO;
import com.thalasi.tverse.service.InventoryService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*") // <--- THIS IS CRITICAL FOR NETWORK ERROR
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/adjust")
    public ResponseEntity<String> adjustStock(@RequestBody StockAdjustmentDTO request) {
        try {
            inventoryService.adjustStock(request);
            return ResponseEntity.ok("Stock updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @PostMapping("/bulk-adjust")
    public ResponseEntity<String> bulkAdjustStock(@RequestParam("file") MultipartFile file){
        try{
            String result=inventoryService.processBulkStockFile(file);
            return ResponseEntity.ok(result);
        }catch (Exception e){
            return ResponseEntity.badRequest().body("Bulk Process Error: "+e.getMessage());
        }
    }

}