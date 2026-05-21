package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.ProductionLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ProductionLotRepo extends JpaRepository<ProductionLot,Long> {

    @Query("SELECT l FROM ProductionLot l WHERE " +
            "(:status IS NULL OR l.status = :status) AND " +
            "(:fromDate IS NULL OR l.creationDate >= :fromDate) AND " +
            "(:toDate IS NULL OR l.creationDate <= :toDate) AND " +
            "(:expFrom IS NULL OR l.expectedDate >= :expFrom) AND " +
            "(:expTo IS NULL OR l.expectedDate <= :expTo) " +
            "ORDER BY l.creationDate DESC")
    List<ProductionLot> filterLots(
            @Param("status") String status,
            @Param("fromDate") LocalDateTime  fromDate,
            @Param("toDate") LocalDateTime  toDate,
            @Param("expFrom") LocalDateTime  expFrom,
            @Param("expTo") LocalDateTime  expTo
    );
}
