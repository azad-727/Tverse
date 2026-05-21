package com.thalasi.tverse.service;

import com.thalasi.tverse.model.DailyDashboardSnapshot;
import com.thalasi.tverse.projection.SkuRevenueProjection;
import com.thalasi.tverse.repository.DashboardSnapshotRepository;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode; // CRITICAL: Missing Import resolved
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service // 1. Enforce Component Scanning
public class AbcAnalysisService {

    // 2. Inject your dependencies cleanly
    @Autowired
    private SalesOrderRepo salesOrderRepo;

    @Autowired
    private DashboardSnapshotRepository snapshotRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduleNightlyAnalysis() {
        System.out.println("CRON TASK TRIGGERED: Starting nightly ABC analysis...");
        this.executeNightlyAbcAnalysis();
        System.out.println("CRON TASK COMPLETE: ABC analysis stored successfully.");
    }

    // 3. Encapsulate execution inside a clear method
    public void executeNightlyAbcAnalysis() {
        // Look back far enough to catch your test data (e.g., 5 years or 30 days)
        LocalDateTime startDate = LocalDateTime.now().minusYears(5);

        List<SkuRevenueProjection> sortedRevenues = salesOrderRepo.findAggregatedRevenuePerSku(startDate);

        if (sortedRevenues == null || sortedRevenues.isEmpty()) {
            return;
        }

        // FIX 1: Added .filter(p -> p.getTotalRevenue() != null) to protect the stream
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
            // FIX 2: Skip this row if the calculated revenue happens to be null
            if (projection.getTotalRevenue() == null || projection.getSku() == null) {
                continue;
            }

            runningTotal = runningTotal.add(projection.getTotalRevenue());

            double cumulativePercentage = runningTotal.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;

            String category;
            if (cumulativePercentage <= 80.0) {
                category = "A";
            } else if (cumulativePercentage <= 95.0) {
                category = "B";
            } else {
                category = "C";
            }

            DailyDashboardSnapshot snapshot = new DailyDashboardSnapshot();
            snapshot.setSnapshotDate(LocalDate.now());
            snapshot.setMetricType("ABC_ANALYSIS");
            snapshot.setMetricKey(projection.getSku());
            snapshot.setMetricValue(category);

            snapshotsToSave.add(snapshot);
        }

        snapshotRepository.saveAll(snapshotsToSave);
    }
}