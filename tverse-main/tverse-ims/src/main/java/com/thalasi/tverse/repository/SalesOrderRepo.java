package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.projection.SkuRevenueProjection;
import com.thalasi.tverse.projection.SkuVelocityProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    @Query("SELECT o FROM SalesOrder o WHERE o.orderId LIKE %:query% OR o.sku LIKE %:query% OR o.customerName LIKE %:query%")
    List<SalesOrder> searchOrders(@Param("query") String query);

    //---- Filtering with multiple options

    @Query("SELECT o FROM SalesOrder o WHERE"+
    "(:status IS NULL OR o.orderStatus =:status) AND "+
    "(:channel IS NULL OR o.channel=:channel) AND"+
    "(:fromDate IS NULL OR o.orderDate >=:fromDate) AND"+
    "(:toDate IS NULL OR o.orderDate <=:toDate) AND"+
    "(:dispatchDate IS NULL OR DATE(o.dispatchByDate) = DATE(:dispatchDate))")
    List<SalesOrder> filterOrders(
        @Param("status") String status,
        @Param("channel") String channel,
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        @Param("dispatchDate") LocalDateTime dispatchDate
    );
//    @Query("SELECT i.sku, SUM(i.sellingPrice * i.quantity) " +
//            "FROM SalesOrderItem i " +
//            "GROUP BY i.sku " +
//            "ORDER BY SUM(i.sellingPrice * i.quantity) DESC")
//    List<Object[]> getSalesBySku();
    List<SalesOrder> findByTrackingId(String vCode);

    List<SalesOrder> findByOrderItemId(String hCode);
    // Add this inside SalesOrderRepo interface:
    @Query("SELECT s FROM SalesOrder s WHERE s.orderDate >= :startDate AND s.orderDate <= :endDate")
    List<SalesOrder> findOrdersByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    List<SalesOrder> findByOrderId(String vCode);
    @Query("SELECT s.sku AS sku, SUM(s.quantity * s.sellingPrice) AS totalRevenue " +
            "FROM SalesOrder s " +
            "WHERE s.orderStatus IN ('SHIPPED', 'DELIVERED') " + // Matches your entity's 'orderStatus'
            "AND s.orderDate >= :startDate " +                    // Matches your entity's 'orderDate'
            "GROUP BY s.sku " +
            "ORDER BY totalRevenue DESC")
    List<SkuRevenueProjection> findAggregatedRevenuePerSku(@Param("startDate") LocalDateTime startDate);
    @Query("SELECT s.sku AS sku, CAST(SUM(s.quantity) AS int) AS totalUnitsSold " +
            "FROM SalesOrder s " +
            "WHERE s.orderStatus IN ('SHIPPED', 'DELIVERED') " +
            "AND s.orderDate >= :startDate " +
            "GROUP BY s.sku")
    List<SkuVelocityProjection> findSalesVelocityPerSku(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT o FROM SalesOrder o WHERE o.orderStatus = :status AND o.orderDate >= :date")
    List<SalesOrder> findByStatusAndDateAfter(@Param("status") String status, @Param("date") LocalDateTime date);

    Optional<SalesOrder> findByOrderIdAndSku(String orderId, String sku);
    List<SalesOrder> findOrdersByMultiSearch(@Param("query") String query);



}