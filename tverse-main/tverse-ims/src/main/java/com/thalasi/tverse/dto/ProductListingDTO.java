package com.thalasi.tverse.dto;

import lombok.Data;
import java.math.BigDecimal;
@Data
public class ProductListingDTO {
    private Long variantId;
    private String sku;
    private String productName;
    private String category;
    private String brand;
    private String imageUrl;
    private String variantImageUrl;

    // Quick Edit Fields
    private BigDecimal costPrice;
    private BigDecimal regularPrice;
    private BigDecimal salePrice;
    private boolean isActive;
    private int stock;

    // Details
    private String color; // Size: M, Color: Red
    private String size;
    private String location;
}