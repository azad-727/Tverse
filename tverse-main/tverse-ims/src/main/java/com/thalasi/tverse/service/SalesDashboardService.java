package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.DailyTrendDTO;
import com.thalasi.tverse.dto.ProductPerformanceDTO;
import com.thalasi.tverse.dto.SalesOverviewDTO;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        // --- NEW: HashMaps to group data for the React Chart and Table ---
        Map<String, DailyTrendDTO> trendMap = new HashMap<>();
        Map<String, ProductPerformanceDTO> productMap = new HashMap<>();

        // This formats the date for the Recharts X-Axis (e.g., "15 May")
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM");

        // 3. Crunch the numbers
        for (SalesOrder order : orders) {
            BigDecimal orderValue = order.getSellingPrice().multiply(new BigDecimal(order.getQuantity()));
            int qty = order.getQuantity();
            String status = order.getOrderStatus() != null ? order.getOrderStatus().toUpperCase() : "UNKNOWN";

            // --- A. Top Level KPIs ---
            dto.setGrossSales(dto.getGrossSales().add(orderValue));
            dto.setGrossUnits(dto.getGrossUnits() + qty);

            // --- B. Group By Date (For the Chart) ---
            // NOTE: If your date field is named something else like getCreatedAt(), change it here!
            String dateStr = order.getOrderDate().format(dateFormatter);
            DailyTrendDTO trend = trendMap.computeIfAbsent(dateStr, k -> new DailyTrendDTO(dateStr));
            trend.gross = trend.gross.add(orderValue);

            // --- C. Group By SKU (For the Table) ---
            String sku = order.getSku();
            ProductPerformanceDTO prod = null;
            if(sku != null) {
                prod = productMap.computeIfAbsent(sku, k -> new ProductPerformanceDTO(sku));
                prod.gross = prod.gross.add(orderValue);
                prod.units += qty;
            }

            // --- D. Status Switch ---
            switch (status) {
                case "CANCELLED":
                    dto.setCancellations(dto.getCancellations().add(orderValue));
                    dto.setCancelledUnits(dto.getCancelledUnits() + qty);
                    if(prod != null) prod.cancellations += qty; // Add to SKU table
                    break;

                case "RTO": // Return to Origin (Delivery Failed)
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtoUnits(dto.getRtoUnits() + qty);
                    trend.returns = trend.returns.add(orderValue); // Add to Chart
                    if(prod != null) prod.returns += qty; // Add to SKU table
                    break;

                case "RTV": // Return to Vendor (Customer Returned It)
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtvUnits(dto.getRtvUnits() + qty);
                    trend.returns = trend.returns.add(orderValue); // Add to Chart
                    if(prod != null) prod.returns += qty; // Add to SKU table
                    break;

                case "SHIPPED":
                case "DELIVERED":
                    dto.setNetSales(dto.getNetSales().add(orderValue));
                    dto.setNetUnits(dto.getNetUnits() + qty);
                    trend.net = trend.net.add(orderValue); // Add to Chart
                    if(prod != null) prod.netUnits += qty; // Add to SKU table
                    break;
            }
        }

        // --- 4. Package the Grouped Data into the main DTO ---
        dto.setDailyTrends(new ArrayList<>(trendMap.values()));

        // Sort products by Gross Sales (Highest first) so the table shows best-sellers at the top
        List<ProductPerformanceDTO> sortedProducts = productMap.values().stream()
                .sorted((a, b) -> b.gross.compareTo(a.gross))
                .collect(Collectors.toList());
        dto.setTopProducts(sortedProducts);

        return dto;
    }
}