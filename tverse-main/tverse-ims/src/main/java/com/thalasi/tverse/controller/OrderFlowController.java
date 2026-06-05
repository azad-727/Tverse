package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.DailyDispatchDTO;
import com.thalasi.tverse.dto.ManualOrderRequestDTO;
import com.thalasi.tverse.model.DailyDispatch;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.SalesOrderRepo;
import com.thalasi.tverse.service.OrderFlowService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("api/orders/flow")
public class OrderFlowController {
    @Autowired
    private OrderFlowService orderFlowService;
    @Autowired
    private
    SalesOrderRepo salesOrderRepo;

    @GetMapping("/list")
    public ResponseEntity<List<SalesOrder>> getOrdersByStatus(@RequestParam String status){
        return ResponseEntity.ok(orderFlowService.getOrdersByStatus(status));
    }
    @GetMapping("/counts")
    public ResponseEntity<Map<String,Long>> getOrderCounts(){
        Map<String,Long> stats=new HashMap<>();
        stats.put("approved",salesOrderRepo.countByOrderStatus("APPROVED"));
        stats.put("packing_in_progress",salesOrderRepo.countByOrderStatus("PACKING_IN_PROGRESS"));
        stats.put("packed",salesOrderRepo.countByOrderStatus("PACKED"));
        stats.put("dispatch_ready",salesOrderRepo.countByOrderStatus("DISPATCH_READY"));
        stats.put("shipped",salesOrderRepo.countByOrderStatus("SHIPPED"));
        return ResponseEntity.ok(stats);
    }
    @PostMapping("/generate-labels")
    public ResponseEntity<String> generateLables(@RequestBody Map<String, List<Long>> payload) {

        List<Long> orderIds = payload.get("ids");

        if ( orderIds == null ||orderIds.isEmpty()) {
            return ResponseEntity.badRequest().body("No orders selected");
        }
        try {

            // Call Services
            orderFlowService.processLabels(orderIds);

            return ResponseEntity.ok("Moved to Packing");

        } catch (Exception e){
            return ResponseEntity.internalServerError().body("Error: "+e.getMessage());
        }
    }
    @PostMapping("/mark-packed")
    public ResponseEntity<String> markPacked(@RequestBody Map<String,List<Long>> payload){
        List<Long> orders=payload.get("ids");
        if( orders == null ||orders.isEmpty()){
            return ResponseEntity.badRequest().body("No Orders Found");
        }
        try{
            orderFlowService.markAsPacked(orders);
            return ResponseEntity.ok("Orders Marked as Packed");
        }catch(Exception e){
            return ResponseEntity.internalServerError().body("Error: "+e.getMessage());
        }

    }
    @PostMapping("/mark-rtd")
    public ResponseEntity<String> markRtd(@RequestBody Map<String,List<Long>> payload){
        List<Long> orders=payload.get("ids");
        if(orders == null ||orders.isEmpty()){
            return ResponseEntity.badRequest().body("Order Not Found");
        }
        try{
            orderFlowService.markReadyToDispatch(orders);
            return ResponseEntity.ok("Order Marked as RTD");

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Errors: "+e.getMessage());
        }
    }

    @PostMapping("/manifest")
    public ResponseEntity<String> manifest(@RequestBody Map<String,List<Long>> payload){
        List<Long> orders=payload.get("ids");
        if(orders == null ||orders.isEmpty()){
            return ResponseEntity.badRequest().body("Orders not Found");
        }
        try{
            orderFlowService.generateManifest(orders);
            return ResponseEntity.ok().body("Orders Manifested ");

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erros: "+e.getMessage());
        }
    }
    @PostMapping("/cancel")
    public ResponseEntity<String> cancel(@RequestBody Map<String,List<Long>> payload){
        List<Long> orders=payload.get("ids");
        if(orders == null || orders.isEmpty()){
            return ResponseEntity.badRequest().body("Orders not Found");
        }
        try{
            orderFlowService.cancelOrders(orders);
            return ResponseEntity.ok().body("Orders Cancelled");
        }catch(Exception e){
            return ResponseEntity.internalServerError().body("Errors:"+ e.getMessage());
        }
    }
    @PostMapping("/delete")
    public ResponseEntity<String> deleteOrders(@RequestBody Map<String,List<Long>> payload){
        List<Long> orderIds=payload.get("ids");

        if(orderIds==null||orderIds.isEmpty()){
            return ResponseEntity.badRequest().body("No orders selected");
        }

        try{
            orderFlowService.deleteOrders(orderIds);
            return ResponseEntity.ok("Orders Deleted and Inventory Reverted");
        }catch(Exception e){
            return ResponseEntity.internalServerError().body("Delete Failed:"+e.getMessage());
        }
    }
    @PostMapping("/on-hold")
    public ResponseEntity<String> onhold(@RequestBody Map<String,List<Long>> payload){
        List<Long> orders=payload.get("ids");
        if(orders == null || orders.isEmpty()){
            return ResponseEntity.badRequest().body("Orders not Found");
        }
        try{
            orderFlowService.holdOrders(orders);
            return ResponseEntity.ok().body("Orders On-Hold");

        }catch(Exception e){
            return ResponseEntity.internalServerError().body("Errors:"+e.getMessage());

        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<SalesOrder>> search(@RequestParam String query){
        return ResponseEntity.ok(salesOrderRepo.searchOrders(query));
    }
    @GetMapping("/filter")
    public ResponseEntity<List<SalesOrder>> filterOrders(
            @RequestParam(required = false)String status,
            @RequestParam(required = false)String channel,
            @RequestParam(required = false)String fromDate,
            @RequestParam(required = false)String toDate,
            @RequestParam(required = false)String dispatchDate
    ){
        LocalDateTime start = parseDate(fromDate,false);
        LocalDateTime end = parseDate(toDate,true);
        LocalDateTime dispatch = parseDate(dispatchDate,false);

        List<SalesOrder> results = salesOrderRepo.filterOrders(status,channel,start,end,dispatch);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/manual")
        public ResponseEntity<String> createManualOrder(@RequestBody ManualOrderRequestDTO request){
        try{
            orderFlowService.createManualOrder(request);
            return ResponseEntity.ok("Manual Order Created Successfully");
        }catch(Exception e){
            return ResponseEntity.badRequest().body("Error :"+ e.getMessage());
        }
    }
    // Helper to convert String "yyyy-MM-dd" to LocalDateTime
    private LocalDateTime parseDate(String dateStr, boolean isEndOfDay) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null; // Return null so the DB query ignores this filter
        }
        try {
            // 1. Parse the String to a Date (e.g., 2025-12-20)
            java.time.LocalDate date = java.time.LocalDate.parse(dateStr);

            // 2. Add Time
            if (isEndOfDay) {
                // If filtering "To Date", we want up to 23:59:59 of that day
                return date.atTime(23, 59, 59);
            } else {
                // If filtering "From Date", we want from 00:00:00
                return date.atStartOfDay();
            }
        } catch (Exception e) {
            // If the date format is wrong, ignore it
            return null;
        }
    }

}
