package com.thalasi.tverse.projection;

import org.springframework.stereotype.Service;

@Service
public interface SkuVelocityProjection {
    public String getSku();
    public Integer getTotalUnitsSold();
}
