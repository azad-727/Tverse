package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
public class product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Foreign Key to Category
    @ManyToOne
    @JoinColumn(name = "category_id")
    private category category;

    // Foreign Key to Brand
    @ManyToOne
    @JoinColumn(name = "brand_id")
    private brand brand;

    private String hsnCode;

    @Column(nullable = false, columnDefinition = "DECIMAL(5,2) default '0.00'")
    private BigDecimal taxRate;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(length = 500) // Allow long URLs
    private String imageUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}