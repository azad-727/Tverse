package com.thalasi.tverse.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
public class SalesOverviewDTO {
    private List<DailyTrendDTO> dailyTrends = new ArrayList<>();
    private List<ProductPerformanceDTO> topProducts = new ArrayList<>();
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
    public List<DailyTrendDTO> getDailyTrends() { return dailyTrends; }
    public void setDailyTrends(List<DailyTrendDTO> dailyTrends) { this.dailyTrends = dailyTrends; }

    public List<ProductPerformanceDTO> getTopProducts() { return topProducts; }
    public void setTopProducts(List<ProductPerformanceDTO> topProducts) { this.topProducts = topProducts; }
    public List<Map<String, Object>> channelData = new ArrayList<>();
    public List<Map<String, Object>> monthlyData = new ArrayList<>();
}