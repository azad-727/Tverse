package com.thalasi.tverse.service;

import com.thalasi.tverse.model.DailyDashboardSnapshot;
import com.thalasi.tverse.projection.SkuVelocityProjection;
import com.thalasi.tverse.repository.DashboardSnapshotRepository;
import com.thalasi.tverse.repository.ProductVariantRepo;
import com.thalasi.tverse.repository.SalesOrderRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class StockoutPredictorService {

    @Autowired
    private SalesOrderRepo salesOrderRepo;

    @Autowired
    private DashboardSnapshotRepository snapshotRepository;

     @Autowired
    private ProductVariantRepo variantRepo;

    // Runs at 2:30 AM, right after the ABC analysis finishes!
    @Scheduled(cron = "0 30 2 * * ?")
    public void executeNightlyStockoutPrediction() {
        System.out.println("CRON TASK: Running Stockout Predictor Engine...");

        // Used a 30-day rolling window for velocity
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        List<SkuVelocityProjection> velocities = salesOrderRepo.findSalesVelocityPerSku(startDate);

        if (velocities == null || velocities.isEmpty()) return;

        List<DailyDashboardSnapshot> snapshotsToSave = new ArrayList<>();

        for (SkuVelocityProjection projection : velocities) {
            String sku = projection.getSku();
            Integer unitsSold = projection.getTotalUnitsSold();

            if (sku == null || unitsSold == null || unitsSold == 0) continue;

            // 1. Calculate Daily Sales Velocity
            double dailyVelocity = unitsSold / 30.0;

            // 2. Fetch Current Physical Stock
            int currentStock = variantRepo.findBySku(sku)
                    .map(variant -> variant.getStockOnHand()) // If found, get the stock
                    .orElse(0);
            if(currentStock==0){
                continue;
            }

            // 3. Calculate Days of Inventory (DOI)
            int daysOfInventory = (int) Math.round(currentStock / dailyVelocity);

            // 4. Evaluate Reorder Alerts (Assuming 20-day supplier lead time)
            String alertStatus;
            if (daysOfInventory <= 15) {
                alertStatus = "CRITICAL_STOCKOUT";
            } else if (daysOfInventory <= 30) {
                alertStatus = "WARNING_LOW_STOCK";
            } else {
                alertStatus = "HEALTHY";
            }

            // 5. Package as JSON String to hold both the Days and the Status
            String metricValueJson = String.format("{\"doi\": %d, \"status\": \"%s\", \"velocity\": %.1f,\"unitsSold\":%1.f}",
                    daysOfInventory, alertStatus, dailyVelocity,unitsSold);

            DailyDashboardSnapshot snapshot = new DailyDashboardSnapshot();
            snapshot.setSnapshotDate(LocalDate.now());
            snapshot.setMetricType("STOCKOUT_PREDICTOR");
            snapshot.setMetricKey(sku);
            snapshot.setMetricValue(metricValueJson); // Saving complex data as JSON string!

            snapshotsToSave.add(snapshot);
        }

        snapshotRepository.saveAll(snapshotsToSave);
        System.out.println("CRON TASK COMPLETE: Stockout predictions stored.");
    }
}