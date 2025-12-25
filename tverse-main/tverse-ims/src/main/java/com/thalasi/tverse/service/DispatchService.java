package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.DailyDispatchDTO;
import com.thalasi.tverse.model.DailyDispatch;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.DailyDispatchRepo;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DispatchService {

    @Autowired
    private SalesOrderRepo orderRepo;
    @Autowired
    private DailyDispatchRepo dispatchRepo;

    @Transactional
    public SalesOrder processScan(DailyDispatchDTO request){

        // 1. Clean Barcodes

        String vCode=request.getVerticalBarcode() !=null? request.getVerticalBarcode().trim() :"" ;
        String hCode= request.getHorizontalBarcode() != null? request.getHorizontalBarcode().trim() :"" ;

        // 2. FIND ORDER
        SalesOrder order=null;
        Optional<SalesOrder> optTracking=orderRepo.findByTrackingId(vCode);
        if(optTracking.isPresent()){
            order=optTracking.get();
        }
        else{
            Optional<SalesOrder>optOrder=orderRepo.findByTrackingId(hCode);
            if(optOrder.isEmpty()){
                optOrder=orderRepo.findByOrderItemId(hCode);
            }
            if(optOrder.isPresent()){
                order = optOrder.get();
            }
        }
        // 3. VALIDATION (The Guard)
        if(order == null){
            throw new RuntimeException("Order NOT FOUND. Check Barcodes.");
        }
        if("CANCELLED".equalsIgnoreCase(order.getOrderStatus())){
            throw new RuntimeException("STOP! Order is CANCELLED");
        }
        if("DISPATCH_READY".equalsIgnoreCase(order.getOrderStatus())){
            throw new RuntimeException("Warning: Already Scanned.");
        }

        order.setOrderStatus("DISPATCH_READY");

        order.setCourierPartner(request.getCourierPartner());
        orderRepo.save(order);

        DailyDispatch log= new DailyDispatch();
        log.setOrderId(Long.parseLong(order.getOrderId()));
        log.setSku(order.getSku());

        // Session Info
        log.setStaffName(request.getStaffName());
        log.setChannel(request.getChannel());
        log.setCourierPartner(request.getCourierPartner());
        log.setBrandName(request.getBrandName());

        // Raw Data
        log.setVerticalBarcode(vCode);
        log.setHorizontalBarcode(hCode);
        log.setScanTime(LocalDateTime.now());

        dispatchRepo.save(log);

        return order;
    }

}
