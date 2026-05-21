package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;

@Entity
@Table(name="product_bundle")
@Data
public class ProductBundle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String comboSku;

    private String componentSku;

    private int qty;
}
