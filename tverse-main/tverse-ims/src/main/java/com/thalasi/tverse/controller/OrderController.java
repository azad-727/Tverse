package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.PicklistResultDTO;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.model.SalesReturn;
import com.thalasi.tverse.repository.SalesOrderRepo;
import com.thalasi.tverse.service.PicklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private PicklistService picklistService;
    @Autowired
    private SalesOrderRepo repo;

    @PostMapping("/generate-picklist")
    public ResponseEntity<?> generatePicklist(@RequestParam("file") MultipartFile file,
                                              @RequestParam(value="channel", defaultValue = "Unknown")String channel,
                                              @RequestParam(value="brand", defaultValue = "Unknown") String brand) {
        try {
            List<PicklistResultDTO> result = picklistService.generatePicklist(file,channel,brand);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @GetMapping("/search")
    public ResponseEntity<List<SalesOrder>> searchOrders(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Clean the input to remove accidental scanner spaces
        String cleanQuery = query.trim();

        // Use the new multi-column search so it finds Order IDs, Tracking IDs, and Shipment IDs
        List<SalesOrder> results = repo.findOrdersByMultiSearch(cleanQuery);
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/picklist/{picklistId}")
    public ResponseEntity<String> deleteBatch(@PathVariable String picklistId){
        try {
            String message= picklistService.deletePicklistBatch(picklistId);
            return ResponseEntity.ok(message);

        }catch(Exception e){
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

}