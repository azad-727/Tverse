package com.thalasi.tverse.dto;

import lombok.Data;

@Data
public class LoginRequest {

    private String phoneNumber;
    private String securityPin;

}
