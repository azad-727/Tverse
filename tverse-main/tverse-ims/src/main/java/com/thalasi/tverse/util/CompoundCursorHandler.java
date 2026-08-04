package com.thalasi.tverse.util;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;

public class CompoundCursorHandler {

    private static final ObjectMapper objectmapper= new ObjectMapper().registerModule(new JavaTimeModule());
    @Data
    public static class OrderCursorPayload {
        private LocalDateTime dispatchDate;
        private Long id;
        public OrderCursorPayload(){}
        public OrderCursorPayload(LocalDateTime dispatchDate,Long id){
            this.dispatchDate=dispatchDate;
            this.id=id;
        }
    }
    public static OrderCursorPayload decode(String cursorStr){
        if(cursorStr==null || cursorStr.trim().isEmpty()){
            return null;
        }
        try{
            byte[] decodedBytes= Base64.getDecoder().decode(cursorStr);
            return objectmapper.readValue(decodedBytes,OrderCursorPayload.class);
        } catch(Exception e){
            System.out.println("Invalid Compound Cursor Exception"+e.getMessage());
            return null;
        }
    }
    public static String encode(LocalDateTime dispatchDate,Long id){
        if(dispatchDate == null || id==null){
            return null;
        }
        try{
            OrderCursorPayload orderCursorPayload=new OrderCursorPayload(dispatchDate,id);
            byte[] jsonBytes=objectmapper.writeValueAsBytes(orderCursorPayload);
            return Base64.getEncoder().encodeToString(jsonBytes);
        } catch (Exception e){
            System.out.println("Failed to encode compound cursor:"+e.getMessage());
            return null;
        }
    }

}
