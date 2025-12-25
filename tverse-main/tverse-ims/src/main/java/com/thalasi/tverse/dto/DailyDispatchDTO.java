package com.thalasi.tverse.dto;

import lombok.Data;

@Data
public class DailyDispatchDTO {
    //Session Data
    private String staffName;
    private String channel;
    private String courierPartner;
    private String brandName;

    //Scan Info (Changes every box)
    String verticalBarcode;
    String horizontalBarcode;
}
