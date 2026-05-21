package com.thalasi.tverse.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class DailyDispatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String orderId;
    private String sku;
    private String staffName;
    private String channel;
    private String courierPartner;
    private String brandName;
    private String verticalBarcode;
    private String horizontalBarcode;
    private LocalDateTime scanTime;


}
