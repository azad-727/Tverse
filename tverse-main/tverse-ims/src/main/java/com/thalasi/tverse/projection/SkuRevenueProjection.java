package com.thalasi.tverse.projection;

import java.math.BigDecimal;

public interface SkuRevenueProjection {
    // These names must exactly match the aliases used in the SELECT clause of your query
    String getSku();
    BigDecimal getTotalRevenue();
}