package com.thalasi.tverse.dto;

import java.math.BigDecimal;

public class VariantPerformanceDTO {
    public String sku;
    public String category;
    public int unitsSold;
    public BigDecimal revenue;
    public String status; // "STAR", "CORE", "SLOW", "DEAD"

    public VariantPerformanceDTO(String sku, String category, int unitsSold, BigDecimal revenue) {
        this.sku = sku;
        this.category = category;
        this.unitsSold = unitsSold;
        this.revenue = revenue;
    }
}