package com.thalasi.tverse.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ReturnProcessDTO {
    private String trackingId;

    // 2.
    private String returnType;
    private String returnMainReason;
    private String returnSubReason;
    private String courierPartner;
    private String returnChannel;
    private String sku;
    private int quantity;
    @JsonProperty("isExternalOrder")
    private boolean isExternalOrder;


    // 3.
    @JsonProperty("isGoodCondition")
    private boolean isGoodCondition;

    // 4.
    private String staffName;
}
