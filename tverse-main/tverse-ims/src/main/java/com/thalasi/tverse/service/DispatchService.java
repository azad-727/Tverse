package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.DailyDispatchDTO; // Or ScanPackRequestDTO depending on what you named it
import com.thalasi.tverse.model.DailyDispatch;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.DailyDispatchRepo;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DispatchService {

    @Autowired
    private SalesOrderRepo orderRepo;
    @Autowired
    private DailyDispatchRepo dispatchRepo;

    // FIX 1: Change Return Type to List<SalesOrder>
    @Transactional
    public List<SalesOrder> processScan(DailyDispatchDTO request) {

        // 1. Clean Barcodes
        String vCode = request.getVerticalBarcode() != null ? request.getVerticalBarcode().trim() : "";
        String hCode = request.getHorizontalBarcode() != null ? request.getHorizontalBarcode().trim() : "";

        // 2. FIND ORDERS (Result is a List)
        List<SalesOrder> orders = new ArrayList<>();

        // Strategy: Try Tracking ID first (Vertical)
        if (!vCode.isEmpty()) {
            orders = orderRepo.findByTrackingId(vCode);
        }

        // If not found, try Horizontal (Maybe user scanned swapped?)
        if (orders.isEmpty() && !hCode.isEmpty()) {
            orders = orderRepo.findByTrackingId(hCode);

            // If still not found, try Order ID or Item ID
            if (orders.isEmpty()) {
                orders = orderRepo.findByOrderId(hCode);
                if (orders.isEmpty()) {
                    orders = orderRepo.findByOrderItemId(hCode);
                }
            }
        }

        // 3. VALIDATION (The Guard)
        if (orders.isEmpty()) {
            throw new RuntimeException("Order NOT FOUND. Check Barcodes.");
        }

        int processCount = 0;

        // FIX 2: Iterate through the list
        for (SalesOrder singleOrder : orders) {

            // Skip cancelled
            if ("CANCELLED".equalsIgnoreCase(singleOrder.getOrderStatus())) {
                throw new RuntimeException("STOP! Order is CANCELLED");
            }

            // Skip already scanned
            if ("DISPATCH_READY".equalsIgnoreCase(singleOrder.getOrderStatus())) {
                // We continue loop instead of throwing error, in case one item in box was scanned but others weren't
                // Or if you want to be strict, throw exception.
                // For Multi-item, usually if one is scanned, the whole box is ready.
                continue;
            }

            // Update Status
            singleOrder.setOrderStatus("DISPATCH_READY");
            singleOrder.setCourierPartner(request.getCourierPartner());
            orderRepo.save(singleOrder);

            // Log
            DailyDispatch log = new DailyDispatch();
            log.setOrderId(singleOrder.getOrderId()); // Make sure DailyDispatch orderId is String type
            log.setSku(singleOrder.getSku());

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
            processCount++;
        }

        if (processCount == 0 && !orders.isEmpty()) {
            // If we found orders but didn't process any (because they were all already scanned)
            // We can just return them to show "Success" again, or throw specific warning
            // return orders;
            throw new RuntimeException("Warning: This order is already scanned.");
        }

        // FIX 3: Return the LIST
        return orders;
    }
}