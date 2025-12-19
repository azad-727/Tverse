package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesOrderRepo extends JpaRepository<SalesOrder, Long> {

    // Check Duplicate based on the Smart Key
    boolean existsByUniqueReferenceId(String uniqueReferenceId);

    // Delete Method by PickList Id
    List<SalesOrder> findByPicklistId(String picklistId);
    @Modifying
    @Transactional
    Long deleteByPicklistId(String picklistId);

    // ANALYTICS: Calculate Total Sales
    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM SalesOrder s WHERE s.sku = :sku AND s.orderDate >= :startDate AND s.orderStatus != 'Cancelled'")
    Integer calculateTotalSalesSince(@Param("sku") String sku, @Param("startDate") LocalDateTime startDate);

    Long countByOrderStatus(String orderStatus);
    List<SalesOrder> findByOrderStatusInOrderByDispatchByDateAsc(List<String> statuses);
    long countByOrderStatusIn(List<String> statuses);

    List<SalesOrder> findByOrderStatusOrderByDispatchByDateAsc(String status);
}