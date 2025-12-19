package com.thalasi.tverse.service;

import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderFlowService {

    @Autowired
    private SalesOrderRepo orderRepo;

//     1. Get Orders by Tab (Status)
    public List<SalesOrder> getOrdersByStatus(String status) {
        List<SalesOrder> orders= orderRepo.findByOrderStatusOrderByDispatchByDateAsc(status);

        LocalDateTime now=LocalDateTime.now();
        for(SalesOrder order:orders){
            if(order.getDispatchByDate()!=null){
                long hoursLeft= Duration.between(now,order.getDispatchByDate()).toHours();
                order.setSlaHours(hoursLeft);
            }else{
                order.setSlaHours(0);
            }
        }
        return orders;
    }

    // 2. Action: Generate Labels (Move to PACKING_IN_PROGRESS)
    @Transactional
    public void generateLabels(List<Long> orderIds) {
        List<SalesOrder> orders = orderRepo.findAllById(orderIds);
        for (SalesOrder order : orders) {
            if ("APPROVED".equals(order.getOrderStatus())) {
                order.setOrderStatus("PACKING_IN_PROGRESS");
                // In real app, here we would call PDF Generator logic
            }
        }
        orderRepo.saveAll(orders);
    }

    @Transactional
    public void processLabels(List<Long> orderIds){
        List<SalesOrder> orders= orderRepo.findAllById(orderIds);
        for(SalesOrder order : orders){
            if("APPROVED".equals(order.getOrderStatus())){
                order.setOrderStatus("PACKING_IN_PROGRESS");
            }
        }
        orderRepo.saveAll(orders);
    }

    // 3. Action: Mark Packed (Move to PACKED)
    @Transactional
    public void markAsPacked(List<Long> orderIds) {
        List<SalesOrder> orders = orderRepo.findAllById(orderIds);
        for (SalesOrder order : orders) {
            order.setOrderStatus("PACKED");
        }
        orderRepo.saveAll(orders);
    }

    // 4. Action: Ready to Dispatch (Move to DISPATCH_READY)
    @Transactional
    public void markReadyToDispatch(List<Long> orderIds) {
        List<SalesOrder> orders = orderRepo.findAllById(orderIds);
        for (SalesOrder order : orders) {
            order.setOrderStatus("DISPATCH_READY");
        }
        orderRepo.saveAll(orders);
    }

    // 5. Action: Download Manifest (Move to SHIPPED)
    @Transactional
    public void generateManifest(List<Long> orderIds) {
        List<SalesOrder> orders = orderRepo.findAllById(orderIds);
        String newManifestId = "MAN-" + System.currentTimeMillis();
        for (SalesOrder order : orders) {
            order.setOrderStatus("SHIPPED");
            order.setManifestId(newManifestId);
        }
        orderRepo.saveAll(orders);
    }

}