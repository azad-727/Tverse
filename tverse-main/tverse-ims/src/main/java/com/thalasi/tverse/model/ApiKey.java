package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name="api")
@Data
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 12)
    private String keyPrefix;

    @Column(nullable = false, unique = true)
    private String keyHash;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 500)
    private String allowedIps;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime lastUsedAt;
}
