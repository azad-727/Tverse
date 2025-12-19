package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="sales_order_items")
@Data
public class SalesOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sku;

    private int quantity;

    private Double unitPrice;

    @ManyToOne
    @JoinColumn(name="sales_order_id")
    private SalesOrder salesOrder;

}
