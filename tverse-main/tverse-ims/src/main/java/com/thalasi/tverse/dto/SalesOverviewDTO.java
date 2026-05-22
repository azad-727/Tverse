package com.thalasi.tverse.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SalesOverviewDTO {
    private BigDecimal grossSales = BigDecimal.ZERO;
    private int grossUnits = 0;

    private BigDecimal cancellations = BigDecimal.ZERO;
    private int cancelledUnits = 0;

    private BigDecimal returns = BigDecimal.ZERO;
    private int returnUnits = 0;
    private int rtoUnits = 0;
    private int rtvUnits = 0;

    private BigDecimal netSales = BigDecimal.ZERO;
    private int netUnits = 0;
}