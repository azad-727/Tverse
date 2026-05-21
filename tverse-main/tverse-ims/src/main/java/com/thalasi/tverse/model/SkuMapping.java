package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
@Entity
@Table(name="sku_mappings")
@Data
public class SkuMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String channel;

    @Column(nullable = false)
    private String channelSku;

    @Column(nullable = false)
    private String masterSku;

}
