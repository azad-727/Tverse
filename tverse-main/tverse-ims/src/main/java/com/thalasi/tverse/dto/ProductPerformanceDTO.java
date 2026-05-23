package com.thalasi.tverse.dto;
import java.math.BigDecimal;

public class ProductPerformanceDTO {
    public String sku;
    public BigDecimal gross = BigDecimal.ZERO;
    public int units = 0;
    public int cancellations = 0;
    public int returns = 0;
    public int netUnits = 0;

    public ProductPerformanceDTO(String sku) { this.sku = sku; }
}