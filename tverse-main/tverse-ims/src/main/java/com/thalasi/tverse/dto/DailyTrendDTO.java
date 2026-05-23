package com.thalasi.tverse.dto;
import java.math.BigDecimal;

public class DailyTrendDTO {
    public String date;
    public BigDecimal gross = BigDecimal.ZERO;
    public BigDecimal net = BigDecimal.ZERO;
    public BigDecimal returns = BigDecimal.ZERO;

    public DailyTrendDTO(String date) { this.date = date; }
}