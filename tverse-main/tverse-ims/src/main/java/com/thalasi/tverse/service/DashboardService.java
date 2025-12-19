package com.thalasi.tverse.service;

import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.productvariantRepo;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired private productvariantRepo variantRepo;
    @Autowired private SalesOrderRepo salesRepo; // The New Source of Truth

    public Map<String, Object> getDashboardStats() {
        List<productVariant> allVariants = variantRepo.findAll();

        int totalItems = 0;
        BigDecimal totalValue = BigDecimal.ZERO;
        List<Map<String, Object>> productionAlerts = new ArrayList<>();
        List<Map<String, Object>> criticalAlerts = new ArrayList<>();

        // Calculate 30 days ago
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        for (productVariant v : allVariants) {
            // 1. Basic Inventory Math
            totalItems += v.getStockOnHand();
            if (v.getProcurementCost() != null) {
                totalValue = totalValue.add(v.getProcurementCost().multiply(new BigDecimal(v.getStockOnHand())));
            }

            // 2. INTELLIGENT ANALYSIS (Using Real Sales Data)
            int currentStock = v.getStockOnHand();
            int leadTime = v.getSupplierLeadTime() != null ? v.getSupplierLeadTime() : 7; // Default 7 days

            // Get Sales Velocity (Real Customer Orders)
            Integer soldLast30Days = salesRepo.calculateTotalSalesSince(v.getSku(), thirtyDaysAgo);
            if (soldLast30Days == null) soldLast30Days = 0;

            double avgDailySales = soldLast30Days / 30.0;

            // If new product (0 sales), assume base velocity to prevent divide-by-zero logic
            if (avgDailySales == 0 && currentStock > 0) avgDailySales = 0.1;

            // FORMULA: Reorder Point = (Daily Sales * Lead Time)
            int reorderPoint = (int) (avgDailySales * leadTime);

            // Safety Buffer (Minimum stock to sleep well at night)
            int safeBuffer = 10;

            // 3. GENERATE ALERTS
            if (currentStock <= safeBuffer) {
                // CRITICAL: Below Safety Stock
                Map<String, Object> alert = new HashMap<>();
                alert.put("sku", v.getSku());
                alert.put("stock", currentStock);
                alert.put("message", "Critical! Only " + currentStock + " left.");
                criticalAlerts.add(alert);
            }
            else if (currentStock <= (reorderPoint + safeBuffer)) {
                // PRODUCTION CALL: Stock looks fine now, but won't last the Lead Time
                Map<String, Object> alert = new HashMap<>();
                alert.put("sku", v.getSku());
                alert.put("stock", currentStock);
                alert.put("leadTime", leadTime);
                alert.put("velocity", String.format("%.1f sold/day", avgDailySales));
                alert.put("suggested", "Start Production");
                productionAlerts.add(alert);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalStockCount", totalItems);
        response.put("totalInventoryValue", totalValue);
        response.put("productionAlerts", productionAlerts);
        response.put("criticalAlerts", criticalAlerts);

        return response;
    }
}