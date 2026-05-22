package com.thalasi.tverse.service;

import com.thalasi.tverse.model.DailyDashboardSnapshot;
import com.thalasi.tverse.projection.SkuRevenueProjection;
import com.thalasi.tverse.repository.DashboardSnapshotRepository;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AbcAnalysisService {

    @Autowired
    private SalesOrderRepo salesOrderRepo;

    @Autowired
    private DashboardSnapshotRepository snapshotRepository;
    @Transactional
    @Scheduled(cron = "0 0 3 * * SUN") // Runs every Sunday at 3 AM
    public void pruneOldData() {
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);
        snapshotRepository.deleteSnapshotsOlderThan(ninetyDaysAgo);
        System.out.println("CRON: Cleaned up old analytics data to save database space.");
    }
    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduleNightlyAnalysis() {
        System.out.println("CRON TASK TRIGGERED: Starting nightly ABC analysis...");
        this.executeNightlyAbcAnalysis();
        this.executeNightlyParentAbcAnalysis(); // Added this so both run!
        System.out.println("CRON TASK COMPLETE: ABC analysis stored successfully.");
    }
    @Transactional
    public void executeNightlyParentAbcAnalysis() {
        // Use minusYears(5) if you are still testing with old data!
        snapshotRepository.deleteBySnapshotDateAndMetricType(LocalDate.now(), "PARENT_ABC_ANALYSIS");

        LocalDateTime startDate = LocalDateTime.now().minusYears(5);
        List<SkuRevenueProjection> childRevenues = salesOrderRepo.findAggregatedRevenuePerSku(startDate);
        if (childRevenues == null || childRevenues.isEmpty()) return;

        // PHASE 1: Grouping and Merging
        Map<String, BigDecimal> parentRevenueMap = new HashMap<>();
        BigDecimal grandTotal = BigDecimal.ZERO;

        for (SkuRevenueProjection projection : childRevenues) {
            String childSku = projection.getSku();
            if (childSku == null || projection.getTotalRevenue() == null) continue;

            String parentSku = extractParentSku(childSku);
            parentRevenueMap.merge(parentSku, projection.getTotalRevenue(), BigDecimal::add);

            grandTotal = grandTotal.add(projection.getTotalRevenue());
        } // <-- The first loop MUST close here!

        // PHASE 2: Sorting
        List<Map.Entry<String, BigDecimal>> sortedParents = parentRevenueMap.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .toList();

        // PHASE 3: ABC Categorization
        BigDecimal runningTotal = BigDecimal.ZERO;
        List<DailyDashboardSnapshot> snapshotsToSave = new ArrayList<>(); // Initialized the list

        for (Map.Entry<String, BigDecimal> input : sortedParents) {

            if (input.getValue() == null || input.getKey() == null) {
                continue;
            }

            runningTotal = runningTotal.add(input.getValue());

            double cumulativePercentage = runningTotal.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;

            // FIXED: Use input.getValue() instead of projection.getTotalRevenue()
            double contributionPct = input.getValue()
                    .divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;

            String category;
            if (cumulativePercentage <= 80.0) {
                category = "A";
            } else if (cumulativePercentage <= 95.0) {
                category = "B";
            } else {
                category = "C";
            }

            // FIXED: Use input.getValue() for the JSON string
            String metricValueJson = String.format("{\"category\": \"%s\", \"revenue\": %.2f, \"contributionPct\": %.2f}",
                    category, input.getValue(), contributionPct);

            DailyDashboardSnapshot snapshot = new DailyDashboardSnapshot();
            snapshot.setSnapshotDate(LocalDate.now());
            snapshot.setMetricType("PARENT_ABC_ANALYSIS"); // Changed to distinguish from child
            snapshot.setMetricKey(input.getKey()); // Use input.getKey() for parent SKU
            snapshot.setMetricValue(metricValueJson);

            snapshotsToSave.add(snapshot);
        }

        snapshotRepository.saveAll(snapshotsToSave);
    }
    @Transactional
    public void executeNightlyAbcAnalysis() {
        // ... (Your child ABC code is perfect and remains completely unchanged) ...
        snapshotRepository.deleteBySnapshotDateAndMetricType(LocalDate.now(), "ABC_ANALYSIS");

        LocalDateTime startDate = LocalDateTime.now().minusYears(5);        List<SkuRevenueProjection> sortedRevenues = salesOrderRepo.findAggregatedRevenuePerSku(startDate);

        if (sortedRevenues == null || sortedRevenues.isEmpty()) {
            return;
        }

        BigDecimal grandTotal = sortedRevenues.stream()
                .map(SkuRevenueProjection::getTotalRevenue)
                .filter(revenue -> revenue != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (grandTotal.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        BigDecimal runningTotal = BigDecimal.ZERO;
        List<DailyDashboardSnapshot> snapshotsToSave = new ArrayList<>();

        for (SkuRevenueProjection projection : sortedRevenues) {
            if (projection.getTotalRevenue() == null || projection.getSku() == null) {
                continue;
            }

            runningTotal = runningTotal.add(projection.getTotalRevenue());

            double cumulativePercentage = runningTotal.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;

            double contributionPct = projection.getTotalRevenue()
                    .divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;

            String category;
            if (cumulativePercentage <= 80.0) {
                category = "A";
            } else if (cumulativePercentage <= 95.0) {
                category = "B";
            } else {
                category = "C";
            }

            String metricValueJson = String.format("{\"category\": \"%s\", \"revenue\": %.2f, \"contributionPct\": %.2f}",
                    category, projection.getTotalRevenue(), contributionPct);

            DailyDashboardSnapshot snapshot = new DailyDashboardSnapshot();
            snapshot.setSnapshotDate(LocalDate.now());
            snapshot.setMetricType("ABC_ANALYSIS");
            snapshot.setMetricKey(projection.getSku());
            snapshot.setMetricValue(metricValueJson);

            snapshotsToSave.add(snapshot);
        }

        snapshotRepository.saveAll(snapshotsToSave);
    }

    /**
     * Helper method to extract the parent SKU design name.
     * Example: converts "TTS_661_ANIME_BLACK_S" to "TTS_661_ANIME"
     */
    private String extractParentSku(String childSku) {
        String[] parts = childSku.split("_");
        // If the SKU follows the standard 3-part parent naming convention
        if (parts.length >= 3) {
            return parts[0] + "_" + parts[1] + "_" + parts[2];
        }
        // Fallback just in case a SKU is formatted differently
        return childSku;
    }
}