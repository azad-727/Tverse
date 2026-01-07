package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.ProductionLot;
import com.thalasi.tverse.repository.ProductionLotRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manufacturing")
public class ProductionLotController {
    @Autowired
    private ProductionLotRepo productionLotRepo;

    @RequestMapping("/create")
    public ResponseEntity<?> createLot()
}
