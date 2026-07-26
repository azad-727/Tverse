package com.thalasi.tverse.util;

import java.util.Base64;

public class CursorIdHandler {
    public static Long decodeCursorId(String id){
            try {
                if (id == null) {
                    return null;
                } else {
                    byte[] decodedBytes = Base64.getDecoder().decode(id);
                    String decodeResult = new String(decodedBytes);
                    return Long.parseLong(decodeResult);
                }
            }catch(IllegalArgumentException e){
                System.out.println("Invalid Cursor Exception"+e.getMessage());
                return null;
            }
    }
    public static String encodeCursorId(Long id){
        if(id==null){
                return null;
            }
        else{
                return Base64.getEncoder().encodeToString((id).toString().getBytes());
            }
    }
}
