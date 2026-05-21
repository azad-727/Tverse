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
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private PicklistService picklistService;
    @Autowired
    private SalesOrderRepo repo;

    @PostMapping("/generate-picklist")
    public ResponseEntity<?> generatePicklist(@RequestParam("file") MultipartFile file,
                                              @RequestParam(value="channel",defaultValue = "Unknown") String channel) {
        try {
            List<PicklistResultDTO> result = picklistService.generatePicklist(file,channel);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @GetMapping("/search")
    public ResponseEntity<?> scanOrders(@RequestParam String query){
        try{
            List<SalesOrder> orders = repo.findByTrackingId(query);
            if(orders==null||orders.isEmpty())return null;
            return ResponseEntity.ok(orders);


        }catch (Exception e){
            return ResponseEntity.badRequest().body("Errors"+e.getMessage());
        }
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