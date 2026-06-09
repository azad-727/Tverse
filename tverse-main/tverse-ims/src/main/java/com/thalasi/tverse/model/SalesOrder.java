package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "sales_orders", indexes = {
        @Index(name = "idx_unique_ref", columnList = "uniqueReferenceId", unique = true),
        @Index(name = "idx_sku", columnList = "sku")
})
@Data
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- 1. THE GOLDEN KEY (Uniqueness) ---
    // Flipkart = Order Item ID
    // Amazon = OrderID_SKU
    @Column(unique = true, nullable = false)
    private String uniqueReferenceId;

    // --- 2. CORE ORDER INFO ---
    private String channel;       // Flipkart, Amazon, Cocoblu
    private String orderId;       // The main Order Group ID
    private String orderItemId;   // Specific Item ID (Flipkart)
    private String shipmentId;    // Flipkart Shipment
    private String warehouseCode; // For Amazon/Cocoblu

    // --- 3. PRODUCT INFO ---
    private String sku;
    private String productName;
    private String fsn;           // Flipkart
    private String asin;          // Amazon
    private String listingId;     // Flipkart
    private String imei;
    private String brand;
    // For Electronics

    // ---- IMAGES -----
    private String imageUrl;


    // --- 4. QUANTITY & FINANCE ---
    private int quantity;
    private BigDecimal sellingPrice; // Final Price
    private BigDecimal itemCost;     // Base Cost
    private BigDecimal productPayment;
    private BigDecimal taxAmount;    // IGST/CGST/SGST total
    private String invoiceNumber;

    // --- 5. LOGISTICS & DATES ---
    private String trackingId;
    private String orderStatus;// Cancelled, Shipped, Pending
    private LocalDateTime orderDate;
    private String manifestId;
    private LocalDateTime dispatchByDate;
    private LocalDateTime dispatchAfterDate;
    private String courierPartner;

    // --- 6. CUSTOMER / DESTINATION ---
    private String customerName;
    private String customerCity;
    private String customerState;
    private String pincode;

    // --- Picklist Id for Identification
    @Column(name = "picklist_id")
    private String picklistId;

    @Column(name = "actual_payout", precision = 10, scale = 2)
    private BigDecimal actualPayout = BigDecimal.ZERO;

    @Column(name = "ad_spend", precision = 10, scale = 2)
    private BigDecimal adSpend = BigDecimal.ZERO;

    @Column(name = "true_profit", precision = 10, scale = 2)
    private BigDecimal trueProfit = BigDecimal.ZERO;

    // --- 7. AUDIT ---
    private LocalDateTime importedAt;

    @Transient
    private long slaHours;


    @PrePersist
    protected void onCreate() {
        if (this.orderStatus == null) this.orderStatus = "APPROVED";
        this.importedAt = LocalDateTime.now();
    }

}