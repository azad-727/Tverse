package com.thalasi.tverse.dto;
import lombok.Data;

@Data
public class StockAdjustmentDTO {
    private Long variantId;
    private int quantity;
    private String operation;
    private String reason;
    private String performedBy;
}