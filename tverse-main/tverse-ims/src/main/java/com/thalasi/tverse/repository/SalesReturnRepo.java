package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesReturnRepo extends JpaRepository<SalesReturn, Long> {
    // Check if a tracking ID was already processed to prevent duplicates
    boolean existsByTrackingId(String trackingId);
    @Query("SELECT r FROM SalesReturn r WHERE " +
            "(:dateFrom IS NULL OR r.returnDate >= :dateFrom) AND " +
            "(:dateTo IS NULL OR r.returnDate <= :dateTo) AND " +
            "(:staff IS NULL OR r.processedBy=:staff) AND"+
            "(:channel IS NULL OR r.returnChannel=:channel) AND"+
            "(:courier IS NULL OR r.CourierPartner=:courier) AND"+
            "(:status IS NULL OR r.qcStatus = :status) AND " +
            "(:search IS NULL OR r.trackingId LIKE %:search% OR r.sku LIKE %:search%) " +
            "ORDER BY r.returnDate DESC")
    List<SalesReturn> findReturns(
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("status") String status,
            @Param("search") String search,
            @Param("staff") String staff,
            @Param("channel") String channel,
            @Param("courier") String courier
    );
}