package com.thalasi.tverse.service;
import com.thalasi.tverse.dto.productRequestDTO;
import com.thalasi.tverse.model.*;
import com.thalasi.tverse.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class catalogService {

    @Autowired private brandRepo brandRepo;
    @Autowired private categoryRepo categoryRepo;
    @Autowired private productRepo productRepo;
    @Autowired private productvariantRepo variantRepo;
    @Autowired private inventorylogRepo logRepo;

    @Transactional
    public void updateProduct(Long productId,productRequestDTO request){
        //1.
        product parent=productRepo.findById(productId)
                .orElseThrow(()-> new RuntimeException("Product not found"));
        //2.
        parent.setName(request.getProductName());
        parent.setDescription(request.getDescription());
        parent.setHsnCode(request.getHsnCode());
        parent.setTaxRate(request.getTaxRate());
        //3. Handle Brand/Category updates (Check if changed/new)
        if(!parent.getBrand().getName().equals(request.getBrandName())){
            brand newBrand=brandRepo.findByName(request.getBrandName())
                    .orElseGet(() -> {
                        brand newBrand1 = new brand();
                        newBrand1.setName(request.getBrandName());
                        return brandRepo.save(newBrand1);
                    });
            parent.setBrand(newBrand);
        }
        // Update Image if provided
        if(request.getImageUrl()!=null && !request.getImageUrl().isEmpty()){
            parent.setImageUrl(request.getImageUrl());
        }
        productRepo.save(parent);

        if(request.getVariants()!=null) {
            for (productRequestDTO.VariantDTO vDto : request.getVariants()) {
                Optional<productVariant> existingOpt = variantRepo.findBySku(vDto.getSku());
                if (existingOpt.isPresent()) {
                    productVariant variant = existingOpt.get();

                    //---FR-1.6: AUDIT COST CHANGE---
                    if (variant.getProcurementCost().compareTo(vDto.getProcurementCost()) != 0) {
                        inventoryLog log = new inventoryLog();
                        log.setVariant(variant);
                        log.setChangeType("COST_UPDATE");
                        log.setQuantityChanged(0);
                        log.setNewStockOnHand(variant.getStockOnHand());
                        log.setReason("Price changed from" + variant.getProcurementCost() + "to" + vDto.getProcurementCost());
                        log.setPerformedBy("Admin");
                        logRepo.save(log);
                    }
                    variant.setProcurementCost(vDto.getProcurementCost());
                    variant.setSupplierLeadTime(vDto.getSupplierLeadTime());
                    variant.setWarehouseLocation(vDto.getWarehouseLocation());
                    variant.setStockOnHand(vDto.getInitialStock());

                    variantRepo.save(variant);
                }
            }
        }
    }
    // --- FR-1.6: DISABLE PRODUCT ---
    @Transactional
    public void toggleProductStatus(Long productId, boolean isActive) {
        product parent = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        parent.setActive(isActive);
        productRepo.save(parent);
    }

    @Transactional
    public void addNewProduct(productRequestDTO request){
        brand Brand=brandRepo.findByName(request.getBrandName())
                .orElseGet(()->{
                    brand newBrand=new brand();
                    newBrand.setName(request.getBrandName());
                    return brandRepo.save(newBrand);
                });
        category Category=categoryRepo.findByName(request.getCategoryName())
                .orElseGet(()->{
                   category newCat=new category();
                   newCat.setName(request.getCategoryName());
                   return categoryRepo.save(newCat);
                });
     // Product Creation
     product Product = new product();
     Product.setName(request.getProductName());
        Product.setDescription(request.getDescription());
        Product.setBrand(Brand);
        Product.setCategory(Category);
        Product.setHsnCode(request.getHsnCode());
        Product.setTaxRate(request.getTaxRate());
        Product.setImageUrl(request.getImageUrl());
        Product.setActive(true);
        product savedProduct= productRepo.save(Product);

     // Product Variants

     if(request.getVariants() !=null){
         for(productRequestDTO.VariantDTO vDto : request.getVariants()){
             productVariant variant=new productVariant();
             variant.setProduct(savedProduct); //Link to Parent
             variant.setSku(vDto.getSku());
             variant.setSize(vDto.getSize());
             variant.setColor(vDto.getColor());
             variant.setProcurementCost(vDto.getProcurementCost());
             variant.setSupplierLeadTime(vDto.getSupplierLeadTime());
             variant.setWarehouseLocation(vDto.getWarehouseLocation());

             variant.setStockOnHand(vDto.getInitialStock());
             variant.setStockCommitted(0);

             productVariant savedVariant=variantRepo.save(variant);

             if(vDto.getInitialStock()>0){
                 inventoryLog log = new inventoryLog();
                 log.setVariant(savedVariant);
                 log.setQuantityChanged(vDto.getInitialStock());
                 log.setNewStockOnHand(vDto.getInitialStock());
                 log.setChangeType("INITIAL_STOCK");
                 log.setReason("Product Creation / Bulk Upload");
                 log.setPerformedBy("System");
                 logRepo.save(log);
             }
         }
     }

    }

}
