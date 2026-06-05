package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.ReturnProcessDTO;
import com.thalasi.tverse.model.SalesReturn;
import com.thalasi.tverse.repository.SalesReturnRepo;
import com.thalasi.tverse.service.ReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired
    private ReturnService returnService;
    @Autowired
    private SalesReturnRepo returnRepo;

    @PostMapping("/inward")
    public ResponseEntity<String> inwardReturn(@RequestBody ReturnProcessDTO request) {
        try {
            returnService.processReturn(request);
            return ResponseEntity.ok("Return Processed Successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @GetMapping("/logs")
    public ResponseEntity<List<SalesReturn>> getReturnLogs(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String courier,
            @RequestParam(required = false) String staff
    ) {
        // Date parsing logic (same as DispatchLogs - use LocalDate.atStartOfDay)
        LocalDateTime start = (fromDate == null || fromDate.isEmpty()) ?
                LocalDateTime.now().minusDays(30) : LocalDate.parse(fromDate).atStartOfDay();
        LocalDateTime end = (toDate == null || toDate.isEmpty()) ?
                LocalDateTime.now() : LocalDate.parse(toDate).atTime(LocalTime.MAX);


        if (status != null && status.isEmpty()) status = null;
        if (search != null && search.isEmpty()) search = null;
        if(staff != null && staff.isEmpty()) staff=null;
        if(channel !=null && channel.isEmpty()) channel=null;
        if(courier !=null && courier.isEmpty()) courier=null;
        return ResponseEntity.ok(returnRepo.findReturns(start, end, status, search,staff,channel,courier));
    }
}