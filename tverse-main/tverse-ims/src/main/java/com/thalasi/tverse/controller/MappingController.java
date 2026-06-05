package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.ProductBundle;
import com.thalasi.tverse.model.SkuMapping;
import com.thalasi.tverse.repository.ProductBundleRepo;
import com.thalasi.tverse.repository.SkuMappingRepo;
import com.thalasi.tverse.service.MappingService;
import org.apache.commons.math3.stat.descriptive.summary.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/mapping")
public class MappingController {

    @Autowired
    private SkuMappingRepo skuRepo;
    @Autowired
    private ProductBundleRepo bundleRepo;
    @Autowired
    private MappingService mappingService;

    @GetMapping("/aliases")
    public List<SkuMapping> getAllAliases(){
        return skuRepo.findAll();
    }
    @PostMapping("/alias/add")
    public ResponseEntity<?> addAlias(@RequestBody SkuMapping mapping){
        try{
            return ResponseEntity.ok(skuRepo.save(mapping));
        }catch (Exception e){
            return ResponseEntity.badRequest().body("Error: "+e.getMessage());
        }
    }
    @DeleteMapping("/alias/delete/{id}")
    public ResponseEntity<?> deleteAlias(@PathVariable Long id){
        skuRepo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @GetMapping("/bundles")
    public List<ProductBundle> getAllBundles(){
        return bundleRepo.findAll();
    }
    @PostMapping("/bundle/add")
    public ResponseEntity<?> addBundle(@RequestBody ProductBundle bundle){
        try{
            return ResponseEntity.ok(bundleRepo.save(bundle));
        }
        catch(Exception e){
            return ResponseEntity.badRequest().body("Error:"+e.getMessage());
        }
    }

    @DeleteMapping("/bundle/delete/{id}")
    public ResponseEntity<?> deleteBundle(@PathVariable Long id){
        bundleRepo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
    @PostMapping("/upload")
    public ResponseEntity<String> uploadMapping(@RequestParam("file") MultipartFile file,@RequestParam("type") String type){
        try{
            mappingService.processBulkMapping(file,type);
            return ResponseEntity.ok("Bulk"+type+"upload successful!");
        } catch(Exception e){
            return ResponseEntity.badRequest().body("Error: "+ e.getMessage());
        }
    }

}
