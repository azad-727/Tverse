package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_variants")
@Data
public class productVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The Critical Field: SKU
    @Column(nullable = false, unique = true)
    private String sku;

    // Link back to Parent Product
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private product product;

    // Stores {"size": "M", "color": "Blue"} as a String
    @Column
    private String size;
    @Column
    private String color;

    @Column(length=500)
    private String variantImageUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal regularPrice;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal salePrice;


    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal procurementCost;

    private Integer supplierLeadTime;

    private String warehouseLocation;

    // INVENTORY COLUMNS (Directly in this table per your PDF)
    @Column(nullable = false)
    private int stockOnHand = 0;

    @Column(nullable = false)
    private int stockCommitted = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}