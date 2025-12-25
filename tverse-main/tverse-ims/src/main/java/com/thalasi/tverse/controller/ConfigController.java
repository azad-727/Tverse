package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.MasterOptions;
import com.thalasi.tverse.repository.MasterOptionsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/config")
public class ConfigController {
    @Autowired
    private MasterOptionsRepo repo;

    @GetMapping("/{category}")
    public ResponseEntity<List<MasterOptions>> getOptions(@PathVariable String category){
        return ResponseEntity.ok(repo.findByCategory(category));
    }
    @PostMapping("/add")
    public ResponseEntity<?> addOption(@RequestBody MasterOptions option){
        try{
            option.setCategory(option.getCategory().toUpperCase());
            return ResponseEntity.ok(repo.save(option));

        }catch(Exception e){
            return ResponseEntity.badRequest().body("Errors"+e.getMessage());
        }
    }

}
