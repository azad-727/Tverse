package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class MasterOptions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;
    @Column(unique = true)
    private String value;

}
