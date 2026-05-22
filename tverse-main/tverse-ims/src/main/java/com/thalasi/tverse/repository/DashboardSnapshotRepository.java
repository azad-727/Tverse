package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.DailyDashboardSnapshot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DashboardSnapshotRepository extends JpaRepository<DailyDashboardSnapshot, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM DailyDashboardSnapshot d WHERE d.snapshotDate < :cutoffDate")
    void deleteSnapshotsOlderThan(@Param("cutoffDate") LocalDate cutoffDate);

    @Query("SELECT d FROM DailyDashboardSnapshot d WHERE d.metricType = :metricType AND d.snapshotDate = (SELECT MAX(d2.snapshotDate) FROM DailyDashboardSnapshot d2 WHERE d2.metricType = :metricType)")
    List<DailyDashboardSnapshot> findLatestSnapshotsByMetricType(@Param("metricType") String metricType);

    // Fetches the entire compiled snapshot data for a specific day and dashboard tab
    // e.g., findBySnapshotDateAndMetricType(LocalDate.now().minusDays(1), "ABC_ANALYSIS")
    List<DailyDashboardSnapshot> findBySnapshotDateAndMetricType(LocalDate snapshotDate, String metricType);
}