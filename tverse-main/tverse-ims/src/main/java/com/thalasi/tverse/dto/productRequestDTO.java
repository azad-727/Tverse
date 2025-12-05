package com.thalasi.tverse.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class productRequestDTO {
//Product  Details

private String productName;
private String description;
private String brandName;
private String categoryName;
private String hsnCode;
private BigDecimal taxRate;
private String imageUrl;

//Variations Details
    private List<VariantDTO> variants;
    @Data
    public static class VariantDTO{
        private String sku;
        private String size;
        private String color;
        private BigDecimal procurementCost;
        private Integer supplierLeadTime;
        private String warehouseLocation;
        private int initialStock;
    }

 }
