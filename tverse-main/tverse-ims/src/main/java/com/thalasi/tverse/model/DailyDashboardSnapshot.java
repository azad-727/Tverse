package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "daily_dashboard_snapshots", indexes = {
        // CRITICAL: Composite index to make dashboard reads lightning-fast!
        @Index(name = "idx_date_type", columnList = "snapshotDate, metricType")
})
@Data
public class DailyDashboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The date this data represents (e.g., yesterday's closed out numbers)
    @Column(nullable = false)
    private LocalDate snapshotDate;

    // e.g., "ABC_ANALYSIS", "PROFITABILITY_INDEX", "BUSINESS_HEALTH"
    @Column(nullable = false, length = 50)
    private String metricType;

    // The target entity id or name, e.g., "TTS_661_ANIME_2XL" or "GROSS_REVENUE"
    @Column(nullable = false, length = 100)
    private String metricKey;

    // The calculated value stored as a String (e.g., "A", "450.00", "125000")
    // This allows us to store numbers, categories, or small JSON strings dynamically.
    @Column(nullable = false, columnDefinition = "TEXT")
    private String metricValue;
}