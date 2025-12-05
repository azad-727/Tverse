package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_logs")
@Data
public class inventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the specific Variant (SKU)
    @ManyToOne
    @JoinColumn(name = "variant_id")
    private productVariant variant;

    @Column(nullable = false)
    private int quantityChanged; // +10, -5

    @Column(nullable = false)
    private int newStockOnHand; // Snapshot

    @Column(nullable = false)
    private String changeType; // SALE, RETURN, MANUAL

    private String reason;
    private String performedBy;

    private Long orderId; // Optional link to an order

    private Long userId; // Who did it?

    @CreationTimestamp
    private LocalDateTime createdAt;
}