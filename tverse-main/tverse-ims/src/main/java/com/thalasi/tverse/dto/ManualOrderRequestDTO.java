package com.thalasi.tverse.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
@Data
public class ManualOrderRequestDTO {

//    1 ----- Customer Details

    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private String addressLine1;
    private String city;
    private String state;
    private String pincode;

    // ---- 2. Order Details ---
    private String channel;
    private String paymentMode;

    //----- 3. Cart Details ---

    private List<ManualOrderItem> items;

    @Data
    public static class ManualOrderItem{
        private String sku;
        private int qty;
        private BigDecimal sellingPrice;
    }

}
