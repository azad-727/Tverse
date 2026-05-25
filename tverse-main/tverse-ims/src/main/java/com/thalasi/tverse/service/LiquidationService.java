package com.thalasi.tverse.service;

import com.thalasi.tverse.dto.VariantPerformanceDTO;
import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.model.productVariant; // Your entity
import com.thalasi.tverse.repository.SalesOrderRepo;
import com.thalasi.tverse.repository.ProductVariantRepo; // Your new repo
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LiquidationService {

    @Autowired
    private SalesOrderRepo salesOrderRepo;

    @Autowired
    private ProductVariantRepo variantRepo;

    public List<VariantPerformanceDTO> getVariantLifecycle(int days, String categoryFilter) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        // --- 1. INITIALIZE ALL SKUs (To catch the Dead Stock) ---
        Map<String, VariantPerformanceDTO> skuMap = new HashMap<>();

        // Fetch every single physical variant in the warehouse
        List<productVariant> allVariants = variantRepo.findAll();
        for (productVariant variant : allVariants) {
            String sku = variant.getSku();

            // Safely traverse the relational mapping to get the Category Name
            String catName = "Uncategorized";
            if (variant.getProduct() != null && variant.getProduct().getCategory() != null) {
                catName = variant.getProduct().getCategory().getName();
            }

            // Put it in the map with 0 sales default
            skuMap.put(sku, new VariantPerformanceDTO(sku, catName, 0, BigDecimal.ZERO));
        }

        // --- 2. OVERLAY RECENT SALES DATA ---
        List<SalesOrder> recentOrders = salesOrderRepo.findOrdersByDateRange(startDate, LocalDateTime.now());

        for (SalesOrder order : recentOrders) {
            String sku = order.getSku();
            if (sku == null || sku.trim().isEmpty()) continue;

            // If an order comes in for a SKU that got deleted from the master list, add it back safely
            skuMap.putIfAbsent(sku, new VariantPerformanceDTO(sku, "Uncategorized", 0, BigDecimal.ZERO));

            VariantPerformanceDTO dto = skuMap.get(sku);
            int qty = order.getQuantity();

            // Apply B2B (Amazon) vs B2C (Meesho/Flipkart) pricing logic
            BigDecimal price = BigDecimal.ZERO;
            String channel = order.getChannel() != null ? order.getChannel().toUpperCase() : "";
            if (channel.contains("AMAZON")) {
                if (order.getProductPayment() != null && order.getProductPayment().compareTo(BigDecimal.ZERO) > 0) price = order.getProductPayment();
                else if (order.getItemCost() != null && order.getItemCost().compareTo(BigDecimal.ZERO) > 0) price = order.getItemCost();
                else price = order.getSellingPrice() != null ? order.getSellingPrice() : BigDecimal.ZERO;
            } else {
                price = order.getSellingPrice() != null ? order.getSellingPrice() : BigDecimal.ZERO;
            }

            dto.unitsSold += qty;
            dto.revenue = dto.revenue.add(price.multiply(new BigDecimal(qty)));
        }

        // --- 3. FILTER BY CATEGORY ---
        List<VariantPerformanceDTO> filteredList = skuMap.values().stream()
                .filter(dto -> categoryFilter.equals("ALL") || dto.category.equalsIgnoreCase(categoryFilter))
                .collect(Collectors.toList());

        // --- 4. RANK BY UNITS SOLD (Highest to Lowest) ---
        filteredList.sort((a, b) -> Integer.compare(b.unitsSold, a.unitsSold));

        // --- 5. CALCULATE BUCKETS (5% / 15% / 80% / Dead) ---
        // Only count SKUs that actually sold something towards the top % calculations
        int totalSellingSkus = (int) filteredList.stream().filter(dto -> dto.unitsSold > 0).count();
        int top5Index = (int) Math.ceil(totalSellingSkus * 0.05);
        int top20Index = (int) Math.ceil(totalSellingSkus * 0.20);

        for (int i = 0; i < filteredList.size(); i++) {
            VariantPerformanceDTO dto = filteredList.get(i);

            if (dto.unitsSold == 0) {
                dto.status = "DEAD_STOCK";
            } else if (i < top5Index) {
                dto.status = "STAR";
            } else if (i < top20Index) {
                dto.status = "CORE";
            } else {
                dto.status = "SLOW";
            }
        }

        return filteredList;
    }
}