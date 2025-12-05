package com.thalasi.tverse.dto;

import lombok.Data;

@Data
public class PicklistResultDTO {
    private String sku;
    private String productName;
    private String variantDetails; // "Size: M Color: Red"
    private String location;       // "A-01"
    private int orderQty;
    private int stockAvailable;
    private String status;         // "READY", "OUT_OF_STOCK", "SKU_MISMATCH"
    private String imageUrl;
}