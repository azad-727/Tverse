package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class ProductionLot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true)
    private String lotNumber;

    private String skuCode;

    @ManyToOne
    @JoinColumn(name="fabric_id")
    private Fabric fabric;
    private double fabricUsedKgs;

    @CreationTimestamp
    private LocalDateTime  creationDate;
    private LocalDateTime  expectedDate;
    private LocalDateTime  completedDate;

    private String status;
    private String remarks;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name="production_lot_id")
    private List<LotItem> sizedBreakdown;
}
