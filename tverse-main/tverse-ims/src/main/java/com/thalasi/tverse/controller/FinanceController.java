package com.thalasi.tverse.controller;

import com.thalasi.tverse.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @PostMapping("/upload-settlement")
    public ResponseEntity<String> uploadSettlement(
            @RequestParam("file") MultipartFile file,
            @RequestParam("channel") String channel) { // NEW: The Dropdown Value

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a valid CSV file.");
        }

        try {
            String result = financeService.processSettlementCsv(file, channel.toUpperCase());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}