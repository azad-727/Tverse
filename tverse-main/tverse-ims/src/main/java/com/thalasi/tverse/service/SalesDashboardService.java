package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.SalesOverviewDTO;
import com.thalasi.tverse.model.SalesOrder; // <-- Make sure to import your SalesOrder model
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SalesDashboardService {

    @Autowired
    private SalesOrderRepo salesOrderRepo;

    public SalesOverviewDTO getDashboardOverview(int daysToLookBack) {

        // 1. Calculate the date window
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(daysToLookBack);

        // Use a massive window if they select "Lifetime" (e.g., 9999 days)
        if (daysToLookBack > 5000) {
            startDate = LocalDateTime.now().minusYears(20);
        }

        // 2. Fetch all orders in that timeframe
        List<SalesOrder> orders = salesOrderRepo.findOrdersByDateRange(startDate, endDate);
        SalesOverviewDTO dto = new SalesOverviewDTO();

        // 3. Crunch the numbers
        for (SalesOrder order : orders) {
            BigDecimal orderValue = order.getSellingPrice().multiply(new BigDecimal(order.getQuantity()));
            int qty = order.getQuantity();

            // Everything placed counts towards Gross Sales initially
            dto.setGrossSales(dto.getGrossSales().add(orderValue));
            dto.setGrossUnits(dto.getGrossUnits() + qty);

            // Group by exact status
            String status = order.getOrderStatus() != null ? order.getOrderStatus().toUpperCase() : "UNKNOWN";

            switch (status) {
                case "CANCELLED":
                    dto.setCancellations(dto.getCancellations().add(orderValue));
                    dto.setCancelledUnits(dto.getCancelledUnits() + qty);
                    break;

                case "RTO": // Return to Origin (Delivery Failed)
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtoUnits(dto.getRtoUnits() + qty);
                    break;

                case "RTV": // Return to Vendor (Customer Returned It)
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtvUnits(dto.getRtvUnits() + qty);
                    break;

                case "SHIPPED":
                case "DELIVERED":
                    // These are successful Net Sales!
                    dto.setNetSales(dto.getNetSales().add(orderValue));
                    dto.setNetUnits(dto.getNetUnits() + qty);
                    break;
            }
        }


        return dto;
    }
}