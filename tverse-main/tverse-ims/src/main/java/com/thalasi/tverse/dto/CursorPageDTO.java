package com.thalasi.tverse.dto;


import lombok.Data;

import java.util.List;
@Data
public class CursorPageDTO<T> {
    private List<T> items;
    private boolean hasNext;
    private String nextCursor;


}
