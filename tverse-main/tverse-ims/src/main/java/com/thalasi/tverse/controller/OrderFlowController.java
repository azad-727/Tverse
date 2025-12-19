package com.thalasi.tverse.controller;

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
@CrossOrigin(origins = "*")
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
}
