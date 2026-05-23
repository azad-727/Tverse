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

    // NEW: We added a 'channel' parameter to filter the dashboard
    public SalesOverviewDTO getDashboardOverview(int daysToLookBack, String channel) {

        // 1. Calculate the date window
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(daysToLookBack);

        if (daysToLookBack > 5000) {
            startDate = LocalDateTime.now().minusYears(20);
        }

        // 2. Fetch all orders in that timeframe
        List<SalesOrder> orders = salesOrderRepo.findOrdersByDateRange(startDate, endDate);
        SalesOverviewDTO dto = new SalesOverviewDTO();

        Map<String, DailyTrendDTO> trendMap = new HashMap<>();
        Map<String, ProductPerformanceDTO> productMap = new HashMap<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM");

        // 3. Crunch the numbers (BULLETPROOF VERSION)
        for (SalesOrder order : orders) {

            // --- FILTER: Channel Isolation ---
            // If the user selected a specific channel, ignore orders from other channels
            if (channel != null && !channel.equalsIgnoreCase("ALL") && !channel.isEmpty()) {
                String orderChannel = order.getChannel() != null ? order.getChannel().toUpperCase() : "UNKNOWN";
                if (!orderChannel.contains(channel.toUpperCase())) {
                    continue; // Skip this order, it belongs to a different channel
                }
            }

            // --- SAFETY CHECK 1: Skip orders with corrupted/missing dates ---
            if (order.getOrderDate() == null) {
                continue;
            }

            // --- SAFETY CHECK 2: CHANNEL-AWARE PRICE EXTRACTION ---
            BigDecimal price = BigDecimal.ZERO;
            String orderChannel = order.getChannel() != null ? order.getChannel().toUpperCase() : "UNKNOWN";

            if (orderChannel.contains("AMAZON")) {
                // For Amazon/Cocoblu B2B, top-line revenue is the Product Payment or Item Cost
                if (order.getProductPayment() != null && order.getProductPayment().compareTo(BigDecimal.ZERO) > 0) {
                    price = order.getProductPayment();
                } else if (order.getItemCost() != null && order.getItemCost().compareTo(BigDecimal.ZERO) > 0) {
                    price = order.getItemCost();
                } else if (order.getSellingPrice() != null) {
                    price = order.getSellingPrice(); // Absolute fallback
                }
            } else {
                // For B2C Channels (Meesho, Flipkart, Myntra), top-line revenue is Selling Price
                price = order.getSellingPrice() != null ? order.getSellingPrice() : BigDecimal.ZERO;
            }

            // Safe multiplication with the correct, channel-specific price
            BigDecimal orderValue = price.multiply(new BigDecimal(order.getQuantity()));
            int qty = order.getQuantity();
            String status = order.getOrderStatus() != null ? order.getOrderStatus().toUpperCase() : "UNKNOWN";

            // --- A. Top Level KPIs ---
            dto.setGrossSales(dto.getGrossSales().add(orderValue));
            dto.setGrossUnits(dto.getGrossUnits() + qty);

            // --- B. Group By Date (For the Chart) ---
            String dateStr = order.getOrderDate().format(dateFormatter);
            DailyTrendDTO trend = trendMap.computeIfAbsent(dateStr, k -> new DailyTrendDTO(dateStr));
            trend.gross = trend.gross.add(orderValue);

            // --- C. Group By SKU (For the Table) ---
            String sku = order.getSku();
            ProductPerformanceDTO prod = null;
            if(sku != null && !sku.trim().isEmpty()) {
                prod = productMap.computeIfAbsent(sku, k -> new ProductPerformanceDTO(sku));
                prod.gross = prod.gross.add(orderValue);
                prod.units += qty;
            }

            // --- D. Status Switch ---
            switch (status) {
                case "CANCELLED":
                    dto.setCancellations(dto.getCancellations().add(orderValue));
                    dto.setCancelledUnits(dto.getCancelledUnits() + qty);
                    if(prod != null) prod.cancellations += qty;
                    break;

                case "RTO":
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtoUnits(dto.getRtoUnits() + qty);
                    trend.returns = trend.returns.add(orderValue);
                    if(prod != null) prod.returns += qty;
                    break;

                case "RTV":
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtvUnits(dto.getRtvUnits() + qty);
                    trend.returns = trend.returns.add(orderValue);
                    if(prod != null) prod.returns += qty;
                    break;

                case "SHIPPED":
                case "DELIVERED":
                    dto.setNetSales(dto.getNetSales().add(orderValue));
                    dto.setNetUnits(dto.getNetUnits() + qty);
                    trend.net = trend.net.add(orderValue);
                    if(prod != null) prod.netUnits += qty;
                    break;
            }
        }

        // --- 4. Package the Grouped Data ---
        dto.setDailyTrends(new ArrayList<>(trendMap.values()));

        List<ProductPerformanceDTO> sortedProducts = productMap.values().stream()
                .sorted((a, b) -> b.gross.compareTo(a.gross))
                .collect(Collectors.toList());
        dto.setTopProducts(sortedProducts);

        return dto;
    }
}