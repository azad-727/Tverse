package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.Fabric;
import com.thalasi.tverse.model.LotItem;
import com.thalasi.tverse.model.ProductionLot;
import com.thalasi.tverse.repository.FabricRepo;
import com.thalasi.tverse.repository.ProductionLotRepo;
import com.thalasi.tverse.service.ManufacturingService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manufacturing")
public class ManufacturingController {
    @Autowired
    private ProductionLotRepo productionLotRepo;
    @Autowired
    private ManufacturingService service;
    @Autowired
    private FabricRepo fabricRepo;

    // --- Fabric Controller
    @PostMapping("/fabric/add")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<?> addFabric(@RequestBody Fabric fabric ){
        try{
            fabric.setStatus("STORED");
            fabric.setRemainingKgs(fabric.getTotalKgs());
            return ResponseEntity.ok(fabricRepo.save(fabric));
        }catch(Exception e){
            return ResponseEntity.badRequest().body("Errors:"+e.getMessage());
        }
    }

    @GetMapping("/fabrics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public List<Fabric> getAllFabrics(){
        return fabricRepo.findAll();
    }

    // --- Lot Controller
    @GetMapping("/lots")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public List<ProductionLot> getAllLots(){
        return productionLotRepo.findAll();
    }

    // --- Create Lot
    @PostMapping("/lot/create")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<?> createLot(@RequestBody CreateLotRequest request) {
        try {
            ProductionLot lot = new ProductionLot();
            lot.setSkuCode(request.getSkuCode());
            lot.setFabricUsedKgs(request.getFabricUsedKgs());

            // CONVERT LocalDate (Input) to LocalDateTime (DB)
            lot.setExpectedDate(request.getExpectedDate().atStartOfDay());

            lot.setRemarks(request.getRemarks());

            // --- Size Breakdown
            List<LotItem> items = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : request.getSizedBreakdown().entrySet()) {
                LotItem item = new LotItem();
                item.setSize(entry.getKey());
                item.setPlannedQty(entry.getValue());
                item.setRejectedQty(0);
                item.setProduceQty(entry.getValue());
                items.add(item);
            }
            lot.setSizedBreakdown(items);

            return ResponseEntity.ok(service.createLot(lot, request.getFabricId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Errors:" + e.getMessage());
        }
    }

    @PostMapping("/lot/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<?> updateStatus(@RequestBody UpdateStatusRequest request) {
        try {
            return ResponseEntity.ok(
                    service.updateLotStatus(
                            request.getLotId(),
                            request.getNewStatus(),
                            request.getRejections()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("lot/delete/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<String> deleteLot(@PathVariable Long id){
        try{
            service.deleteLot(id); // Use Service method
            return ResponseEntity.ok("Lot Deleted Successfully");
        }catch(Exception e){
            return ResponseEntity.badRequest().body("Errors: "+e.getMessage());
        }
    }

    @GetMapping("/lot/filter")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public List<ProductionLot> filterLots(
            @RequestParam(required=false) String status,
            @RequestParam(required=false) String startDateFrom,
            @RequestParam(required=false) String startDateTo,
            @RequestParam(required=false) String expDateFrom,
            @RequestParam(required=false) String expDateTo
    ) {
        if (status != null && status.isEmpty()) status = null;

        LocalDateTime start = parseStart(startDateFrom);
        LocalDateTime end = parseEnd(startDateTo);
        LocalDateTime expStart = parseStart(expDateFrom);
        LocalDateTime expEnd = parseEnd(expDateTo);

        return productionLotRepo.filterLots(status, start, end, expStart, expEnd);
    }

    @PostMapping("/lot/cancel/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<?> cancelLot(@PathVariable Long id){
        try {
            service.cancelLot(id);
            return ResponseEntity.ok("Cancelled");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- DTOs ---
    @Data
    public static class CreateLotRequest{
        private String skuCode;
        private Long fabricId;
        private double fabricUsedKgs;
        private LocalDate expectedDate; // Keeps simple date for input
        private String remarks;
        private Map<String,Integer> sizedBreakdown;
    }

    @Data
    public static class UpdateStatusRequest{
        private Long lotId;
        private String newStatus;
        private Map<String,Integer> rejections;
    }

    // --- Helpers ---
    private LocalDateTime parseStart(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        try {
            return LocalDate.parse(dateStr).atStartOfDay();
        } catch (Exception e) { return null; }
    }

    private LocalDateTime parseEnd(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        try {
            return LocalDate.parse(dateStr).atTime(LocalTime.MAX);
        } catch (Exception e) { return null; }
    }
}