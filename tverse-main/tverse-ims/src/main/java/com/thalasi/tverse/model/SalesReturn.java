package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Generated;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name ="sales_returns")
@Data
public class SalesReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String trackingId;
    private String channelOrderId;
    private String sku;
    private int qty;

    private String returnType;
    private String returnMainReason;
    private String returnSubReason;
    private String qcStatus;
    private String actionTaken;
    private String CourierPartner;
    private String returnChannel;

    @CreationTimestamp
    private LocalDateTime returnDate;
    private String processedBy;


}
