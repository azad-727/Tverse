package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.DailyDispatchDTO;
import com.thalasi.tverse.model.DailyDispatch;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.DailyDispatchRepo;
import com.thalasi.tverse.service.DispatchService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/dispatch")
public class DispatchController {

    @Autowired
    private DispatchService dispatchService;
    @Autowired
    private DailyDispatchRepo repo;


    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<?> scanOrder(@RequestBody DailyDispatchDTO request){
        try{
            List<SalesOrder> scannedOrder=dispatchService.processScan(request);
            return ResponseEntity.ok(scannedOrder);

        }catch(Exception e){
            return ResponseEntity.badRequest().body("Error"+e.getMessage());
        }
    }
    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<List<DailyDispatch>> getDispatchLogs(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String courier,
            @RequestParam(required = false) String staff,
            @RequestParam(required = false) String search)
    {
        LocalDateTime start=fromDate==null||fromDate.isEmpty()?
        LocalDateTime.now().minusDays(30): LocalDate.parse(fromDate).atStartOfDay();

        LocalDateTime end= toDate==null || toDate.isEmpty()?
        LocalDateTime.now(): LocalDate.parse(toDate).atTime(LocalTime.MAX);

        if (channel != null && channel.isEmpty()) channel = null;
        if (courier != null && courier.isEmpty()) courier = null;
        if (staff != null && staff.isEmpty()) staff = null;
        if (search != null && search.isEmpty()) search = null;

        return ResponseEntity.ok(repo.findLogs(start,end,channel,courier,staff,search));

    }
}
