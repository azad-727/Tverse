package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.ManualOrderRequestDTO;
import com.thalasi.tverse.model.Customer;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.model.SalesOrderItem;
import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.CustomerRepo;
import com.thalasi.tverse.repository.SalesOrderRepo;
import com.thalasi.tverse.repository.productvariantRepo;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrderFlowService {

    @Autowired
    private SalesOrderRepo orderRepo;
    @Autowired
    private productvariantRepo variantRepo;
    @Autowired
    private CustomerRepo customerRepo;

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
            updateInventory(order.getSku(),order.getQuantity(),"DEDUCT");
            order.setManifestId(newManifestId);
        }
        orderRepo.saveAll(orders);
    }

    @Transactional
    public void cancelOrders(List<Long> orderIds){
        List<SalesOrder> orders = orderRepo.findAllById(orderIds);
        for(SalesOrder order : orders){
            order.setOrderStatus("CANCELLED");
            updateInventory(order.getSku(),order.getQuantity(),"RELEASE");
        }
        orderRepo.saveAll(orders);
    }
    @Transactional
    public void holdOrders(List<Long> orderIds){
        List<SalesOrder> orders=orderRepo.findAllById(orderIds);
        for(SalesOrder order:orders){
            if(!(order.getOrderStatus().equals("SHIPPED")||order.getOrderStatus().equals("CANCELLED"))){
                order.setOrderStatus("ON-HOLD");
            }
        }
        orderRepo.saveAll(orders);
    }
    @Transactional
    public void unholdOrders(List<Long> orderIds){
        List<SalesOrder> orders=orderRepo.findAllById(orderIds);
        for(SalesOrder order: orders){
            if(order.getOrderStatus().equals("ON-HOLD")){
                order.setOrderStatus("APPROVED");
            }
        }
    }
    private void updateInventory(String sku,int qty,String action){
        productVariant v = variantRepo.findBySku(sku).orElse(null);

        if(v == null)return; //Skip if Sku not found

        if(action.equals("RESERVE")){
            v.setStockCommitted(v.getStockCommitted() + qty);
        }
        else if(action.equals("DEDUCT")){// Shipped
            v.setStockOnHand(v.getStockOnHand()-qty);
            v.setStockCommitted(v.getStockCommitted()-qty);
        }
        else if(action.equals("RELEASE")){// Cancel
            v.setStockCommitted(v.getStockCommitted()-1);
        }
        variantRepo.save(v);
    }
    @Transactional
    public void createManualOrder(ManualOrderRequestDTO request) {

        // --- 1. CRM LOGIC (Find or Create Customer) ---
        Customer customer = customerRepo.findByPhone(request.getCustomerPhone())
                .orElse(new Customer());

        customer.setName(request.getCustomerName());
        customer.setPhone(request.getCustomerPhone());
        customer.setEmail(request.getCustomerEmail());
        customer.setAddressLine1(request.getAddressLine1());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPincode(request.getPincode());

        // Update Metrics
        customer.setTotalOrders(customer.getTotalOrders() + 1);

        // Calculate Total Spend for this order
        double currentOrderTotal = request.getItems().stream()
                .mapToDouble(item -> item.getSellingPrice().doubleValue() * item.getQty())
                .sum();

        customer.setTotalSpend(customer.getTotalSpend() + currentOrderTotal);

        customerRepo.save(customer);


        // --- 2. ORDER LOGIC (Save one row per item) ---

        // Generate ONE Order ID for the whole batch
        String manualOrderId = "MAN-" + System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();

        for (ManualOrderRequestDTO.ManualOrderItem itemDto : request.getItems()) {

            // A. VALIDATION & INVENTORY
            // Reserve stock (This ensures we don't oversell)
            updateInventory(itemDto.getSku(), itemDto.getQty(), "RESERVE");

            // B. CREATE ROW
            SalesOrder orderRow = new SalesOrder();

            // Common Data (Header Info)
            orderRow.setOrderId(manualOrderId);
            orderRow.setChannel(request.getChannel()); // e.g. "WhatsApp"
            orderRow.setOrderStatus("APPROVED");
            orderRow.setOrderDate(now);

            // Customer Data Snapshot
            orderRow.setCustomerName(customer.getName());
            orderRow.setCustomerCity(customer.getCity());
            orderRow.setCustomerState(customer.getState());
            orderRow.setPincode(customer.getPincode());

            // Item Specific Data
            orderRow.setSku(itemDto.getSku());
            orderRow.setQuantity(itemDto.getQty());
            orderRow.setSellingPrice(itemDto.getSellingPrice());

            // Unique Key Logic for Manual Orders
            // Format: OrderID_SKU (since we don't have Flipkart OrderItemId)
            orderRow.setUniqueReferenceId(manualOrderId + "_" + itemDto.getSku());

            // C. SAVE ROW
            orderRepo.save(orderRow);
        }


        // Note: You can return void or the manualOrderId string
    }

}