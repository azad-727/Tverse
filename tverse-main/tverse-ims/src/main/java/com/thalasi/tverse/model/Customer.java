package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true, nullable = false)
    private String phone; //Primary Key
    private String name;
    private String email;

    //Address Info
    private String addressLine1;
    private String city;
    private String state;
    private String pincode;

    //Mertics CRM
    private int totalOrders;
    private double totalSpend;

    @CreationTimestamp
    private LocalDateTime firstSeenAt;


}
