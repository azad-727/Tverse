package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.DailyDashboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DashboardSnapshotRepository extends JpaRepository<DailyDashboardSnapshot, Long> {

    // Fetches the entire compiled snapshot data for a specific day and dashboard tab
    // e.g., findBySnapshotDateAndMetricType(LocalDate.now().minusDays(1), "ABC_ANALYSIS")
    List<DailyDashboardSnapshot> findBySnapshotDateAndMetricType(LocalDate snapshotDate, String metricType);
}