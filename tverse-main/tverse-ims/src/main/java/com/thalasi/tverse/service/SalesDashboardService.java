package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.DailyTrendDTO;
import com.thalasi.tverse.dto.ProductPerformanceDTO;
import com.thalasi.tverse.dto.SalesOverviewDTO;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    public SalesOverviewDTO getDashboardOverviewByRange(String fromDate, String toDate, String channel,String brand) {

        // Parse the date strings into LocalDateTime
        LocalDateTime startDate = LocalDate.parse(fromDate).atStartOfDay();
        LocalDateTime endDate   = LocalDate.parse(toDate).atTime(23, 59, 59);

        // Fetch orders in that range — reuses your existing repo method
        List<SalesOrder> orders = salesOrderRepo.findOrdersByDateRange(startDate, endDate);

        // Everything below is identical to getDashboardOverview() —
        // just pass the orders list into the same crunching logic.
        // To avoid duplication, refactor like this:

        return crunchOrders(orders, channel,brand);
    }

    // REFACTOR: Extract the crunching logic from getDashboardOverview() into this private method
// so both getDashboardOverview() and getDashboardOverviewByRange() share it.
    private SalesOverviewDTO crunchOrders(List<SalesOrder> orders, String channel,String brand) {

        SalesOverviewDTO dto = new SalesOverviewDTO();
        Map<String, DailyTrendDTO> trendMap = new HashMap<>();
        Map<String, ProductPerformanceDTO> productMap = new HashMap<>();
        Map<String, BigDecimal> channelMap = new HashMap<>();
        Map<String, BigDecimal> monthMap = new HashMap<>();

        DateTimeFormatter dateFormatter  = DateTimeFormatter.ofPattern("dd MMM");
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (SalesOrder order : orders) {
            if (channel != null && !channel.equalsIgnoreCase("ALL") && !channel.isEmpty()) {
                String orderChannel = order.getChannel() != null ? order.getChannel().toUpperCase() : "UNKNOWN";
                if (!orderChannel.contains(channel.toUpperCase())) continue;
            }
            if (brand !=null && !brand.equalsIgnoreCase("ALL") && brand.trim().isEmpty()) {
                String sku=order.getSku();

            }

            if (order.getOrderDate() == null) continue;

            BigDecimal price = BigDecimal.ZERO;
            String orderChannel = order.getChannel() != null ? order.getChannel().toUpperCase() : "UNKNOWN";
            if (orderChannel.contains("AMAZON")) {
                if (order.getProductPayment() != null && order.getProductPayment().compareTo(BigDecimal.ZERO) > 0) price = order.getProductPayment();
                else if (order.getItemCost() != null && order.getItemCost().compareTo(BigDecimal.ZERO) > 0) price = order.getItemCost();
                else if (order.getSellingPrice() != null) price = order.getSellingPrice();
            } else {
                price = order.getSellingPrice() != null ? order.getSellingPrice() : BigDecimal.ZERO;
            }

            BigDecimal orderValue = price.multiply(new BigDecimal(order.getQuantity()));
            int qty = order.getQuantity();
            String status = order.getOrderStatus() != null ? order.getOrderStatus().toUpperCase() : "UNKNOWN";

            dto.setGrossSales(dto.getGrossSales().add(orderValue));
            dto.setGrossUnits(dto.getGrossUnits() + qty);

            String dateStr = order.getOrderDate().format(dateFormatter);
            DailyTrendDTO trend = trendMap.computeIfAbsent(dateStr, k -> new DailyTrendDTO(dateStr));
            trend.gross = trend.gross.add(orderValue);

            String sku = order.getSku();
            ProductPerformanceDTO prod = null;
            if (sku != null && !sku.trim().isEmpty()) {
                prod = productMap.computeIfAbsent(sku, k -> new ProductPerformanceDTO(sku));
                prod.gross = prod.gross.add(orderValue);
                prod.units += qty;
            }

            channelMap.put(orderChannel, channelMap.getOrDefault(orderChannel, BigDecimal.ZERO).add(orderValue));

            String monthStr = order.getOrderDate().format(monthFormatter);
            monthMap.put(monthStr, monthMap.getOrDefault(monthStr, BigDecimal.ZERO).add(orderValue));

            switch (status) {
                case "CANCELLED":
                    dto.setCancellations(dto.getCancellations().add(orderValue));
                    dto.setCancelledUnits(dto.getCancelledUnits() + qty);
                    if (prod != null) prod.cancellations += qty;
                    break;
                case "RTO":
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtoUnits(dto.getRtoUnits() + qty);
                    trend.returns = trend.returns.add(orderValue);
                    if (prod != null) prod.returns += qty;
                    break;
                case "RTV":
                    dto.setReturns(dto.getReturns().add(orderValue));
                    dto.setReturnUnits(dto.getReturnUnits() + qty);
                    dto.setRtvUnits(dto.getRtvUnits() + qty);
                    trend.returns = trend.returns.add(orderValue);
                    if (prod != null) prod.returns += qty;
                    break;
                case "SHIPPED":
                case "DELIVERED":
                    dto.setNetSales(dto.getNetSales().add(orderValue));
                    dto.setNetUnits(dto.getNetUnits() + qty);
                    trend.net = trend.net.add(orderValue);
                    if (prod != null) prod.netUnits += qty;
                    break;
            }
        }

        dto.setDailyTrends(new ArrayList<>(trendMap.values()));
        dto.setTopProducts(productMap.values().stream()
                .sorted((a, b) -> b.gross.compareTo(a.gross))
                .collect(Collectors.toList()));
        channelMap.forEach((name, value) -> {
            Map<String, Object> c = new HashMap<>();
            c.put("name", name); c.put("value", value);
            dto.channelData.add(c);
        });
        monthMap.forEach((month, gross) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("month", month); m.put("gross", gross);
            dto.monthlyData.add(m);
        });

        return dto;
    }

    // UPDATE getDashboardOverview() to call crunchOrders() instead of duplicating logic:
    public SalesOverviewDTO getDashboardOverview(int daysToLookBack, String channel,String brand    ) {
        LocalDateTime endDate   = LocalDateTime.now();
        LocalDateTime startDate = daysToLookBack > 5000
                ? LocalDateTime.now().minusYears(20)
                : endDate.minusDays(daysToLookBack);
        List<SalesOrder> orders = salesOrderRepo.findOrdersByDateRange(startDate, endDate);
        return crunchOrders(orders, channel,brand);
    }

}