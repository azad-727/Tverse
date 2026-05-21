package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.productRequestDTO;
import com.thalasi.tverse.model.DailyDashboardSnapshot;
import com.thalasi.tverse.model.category;
import com.thalasi.tverse.model.product;
import com.thalasi.tverse.repository.*;
import com.thalasi.tverse.service.AbcAnalysisService;
import com.thalasi.tverse.service.StockoutPredictorService;
import com.thalasi.tverse.service.catalogService;
import com.thalasi.tverse.service.ExcelUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import com.thalasi.tverse.dto.ProductListingDTO;
import com.thalasi.tverse.model.productVariant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/catalog")
@CrossOrigin(origins = "*")
public class CatalogController {

    @Autowired private catalogService catalogService;
    @Autowired private ExcelUploadService excelService;
    @Autowired private categoryRepo categoryRepo; // Added Repo
    @Autowired private ProductVariantRepo variantRepo; // Add this Repo
    @Autowired private inventorylogRepo logRepo;
    @Autowired private productRepo productrepo;
    @Autowired private AbcAnalysisService abcService;
    @Autowired private StockoutPredictorService stockService;
    @Autowired private DashboardSnapshotRepository snapshotRepository;
    @Autowired private StockoutPredictorService stockoutService;
    // --- 1. EXISTING ENDPOINTS ---
    @PostMapping("/add")
    public ResponseEntity<String> addSingleProduct(@RequestBody productRequestDTO request) {
        try {
            catalogService.addNewProduct(request);
            return ResponseEntity.ok("Product Created Successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/analytics/trigger-abc")
    public ResponseEntity<String> manualAbcTrigger() {
        try {
            abcService.executeNightlyAbcAnalysis(); // Force-run the computation loop
            return ResponseEntity.ok("✅ ABC Analysis Snapshot calculated and stored successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Trigger Failed: " + e.getMessage());
        }
    }
    @GetMapping("/analytics/abc")
    public ResponseEntity<?> getTodaysAbcAnalysis() {
        try {
            // Fetch the snapshot for today
            List<DailyDashboardSnapshot> data = snapshotRepository.findBySnapshotDateAndMetricType(LocalDate.now(), "ABC_ANALYSIS");
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to load analytics: " + e.getMessage());
        }
    }
    @GetMapping("/analytics/stockout")
    public ResponseEntity<?> getTodaysStockoutPredictions(){
        try{
            List<DailyDashboardSnapshot> data = snapshotRepository.findBySnapshotDateAndMetricType(LocalDate.now(),"STOCKOUT_PREDICTOR");
            return ResponseEntity.ok(data);
        }catch (Exception e){
            return ResponseEntity.internalServerError().body("Failed to load analytics: "+e.getMessage());
        }
    }
    @PostMapping("/analytics/trigger-stockout")
    public ResponseEntity<String> manualStockoutTrigger() {
        try {
            stockoutService.executeNightlyStockoutPrediction();
            return ResponseEntity.ok("✅ Stockout Predictor calculated successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Trigger Failed: " + e.getMessage());
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadBulkProducts(@RequestParam("file") MultipartFile file) {
        try {
            excelService.processBulkUpload(file);
            return ResponseEntity.ok("Bulk Upload Processed Successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload Failed: " + e.getMessage());
        }
    }

    // --- 2. NEW: GET DYNAMIC CATEGORIES ---
    @GetMapping("/categories")
    public ResponseEntity<List<category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepo.findAll());
    }

    // --- 3. NEW: IMAGE UPLOAD ENDPOINT ---
    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Define where to save (Project folder/uploads)
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 2. Generate unique name (to avoid overwrites)
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();

            // 3. Save the file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 4. Return the path (For now, we return the relative path)
            // In a real cloud app, this would be an S3 URL.
            return ResponseEntity.ok("uploads/" + fileName);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Image Upload Failed");
        }
    }
    @PostMapping("/category/add")
    public ResponseEntity<?> addCategory(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Category name is required");
        }

        // Check if exists
        if (categoryRepo.findByName(name).isPresent()) {
            return ResponseEntity.badRequest().body("Category already exists");
        }

        category cat = new category();
        cat.setName(name);
        category saved = categoryRepo.save(cat);
        return ResponseEntity.ok(saved);
    }
    @GetMapping("/list")
    public ResponseEntity<List<ProductListingDTO>> getAllListings() {
        List<productVariant> variants = variantRepo.findAllWithFullProduct();

        List<ProductListingDTO> dtos = variants.stream().map(v -> {
            ProductListingDTO dto = new ProductListingDTO();
            dto.setVariantId(v.getId());
            dto.setSku(v.getSku());
            dto.setCostPrice(v.getProcurementCost());
            dto.setStock(v.getStockOnHand());
            dto.setLocation(v.getWarehouseLocation());
            dto.setSize(v.getSize());
            dto.setColor(v.getColor());

            // Parent Data
            if (v.getProduct() != null) {
                dto.setProductName(v.getProduct().getName());
                dto.setCategory(v.getProduct().getCategory() != null ? v.getProduct().getCategory().getName() : "-");
                dto.setBrand(v.getProduct().getBrand() != null ? v.getProduct().getBrand().getName() : "-");
                dto.setImageUrl(v.getProduct().getImageUrl());

                dto.setVariantImageUrl(v.getVariantImageUrl());
            }
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // --- 6. QUICK EDIT (Stock & Price) ---
    @PutMapping("/quick-update")
    public ResponseEntity<String> quickUpdate(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("variantId").toString());
            int newStock = Integer.parseInt(payload.get("stock").toString());
            BigDecimal newCost = new BigDecimal(payload.get("cost").toString());

            productVariant v = variantRepo.findById(id).orElseThrow(() -> new RuntimeException("Variant not found"));
            v.setStockOnHand(newStock);
            v.setProcurementCost(newCost);

            // In a real system, we would create an InventoryLog entry here too!

            variantRepo.save(v);
            return ResponseEntity.ok("Updated Successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Update Failed: " + e.getMessage());
        }
    }

    // --- 7. DELETE PRODUCT VARIANT ---
    @DeleteMapping("/delete/{id}")
    @Transactional
    public ResponseEntity<String> deleteVariant(@PathVariable Long id) {
        try {
            // 1. Get the Variant and its Parent before deleting
            productVariant variant = variantRepo.findById(id).orElse(null);
            if (variant == null) return ResponseEntity.notFound().build();

            product parent = variant.getProduct();

            // 2. Delete History Logs (Fixes Foreign Key error)
            logRepo.deleteByVariant_Id(id);

            // 3. Delete the Variant
            variantRepo.deleteById(id);

            // 4. SMART CHECK: Does the Parent have any variants left?
            List<productVariant> remaining = variantRepo.findByProduct_id(parent.getId());

            if (remaining.isEmpty()) {
                // If no variants left, delete the Parent Product too
                productrepo.delete(parent);
                return ResponseEntity.ok("Deleted Variant & Parent Product (Cleanup)");
            }

            return ResponseEntity.ok("Deleted Variant Successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Delete Failed: " + e.getMessage());
        }
    }// --- 9. SEARCH SINGLE VARIANT BY SKU ---
    @GetMapping("/search")
    public ResponseEntity<?> getVariantBySku(@RequestParam String sku) {
        Optional<productVariant> opt = variantRepo.findBySku(sku);
        if (opt.isPresent()) {
            productVariant v = opt.get();

            // Map to simple DTO
            ProductListingDTO dto = new ProductListingDTO();
            dto.setVariantId(v.getId());
            dto.setSku(v.getSku());
            dto.setProductName(v.getProduct().getName());
            dto.setSize(v.getSize());
            dto.setColor(v.getColor());
            dto.setStock(v.getStockOnHand());

            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/detail/{sku}")
    public ResponseEntity<?> getProductDetail(@PathVariable String sku) {
        try {
            // 1. Find the variant (Ensure variantRepo.findBySkuWithProduct uses JOIN FETCH to avoid N+1)
            productVariant variant = variantRepo.findBySkuWithFullProduct(sku)
                    .orElseThrow(() -> new RuntimeException("Variant not found for SKU: " + sku));

            // 2. Get the Parent Product
            product parent = variant.getProduct();

            // 3. Get ALL sibling variants for this parent
            List<productVariant> allVariants = variantRepo.findByProduct_id(parent.getId());

            // 4. Construct a Composite Response (Excellent pattern for avoiding infinite JSON recursion)
            Map<String, Object> response = new HashMap<>();

            // Parent Data
            response.put("productId", parent.getId());
            response.put("productName", parent.getName());
            response.put("brandName", parent.getBrand() != null ? parent.getBrand().getName() : "");
            response.put("categoryName", parent.getCategory() != null ? parent.getCategory().getName() : "");
            response.put("description", parent.getDescription());
            response.put("hsnCode", parent.getHsnCode());
            response.put("taxRate", parent.getTaxRate());
            response.put("imageUrl", parent.getImageUrl());
            response.put("isActive", parent.isActive()); // ADDED: React defaults this to true if missing, better to supply it

            // Variants Data
            List<Map<String, Object>> variantList = allVariants.stream().map(v -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", v.getId());
                map.put("sku", v.getSku());
                map.put("size", v.getSize());
                map.put("color", v.getColor());
                map.put("cost", v.getProcurementCost());
                map.put("stock", v.getStockOnHand());
                map.put("location", v.getWarehouseLocation());
                map.put("variantImageUrl", v.getVariantImageUrl()); // FIX: Added to match React frontend mapping
                return map;
            }).collect(Collectors.toList());

            response.put("variants", variantList);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // In production, consider logging this stack trace using SLF4J (e.g., log.error("Error fetching SKU", e))
            return ResponseEntity.status(404).body("Error: " + e.getMessage());
        }
    }
    // ... inside CatalogController ...

    // Update Product Details
    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateProduct(@PathVariable Long id, @RequestBody productRequestDTO request) {
        try {
            catalogService.updateProduct(id, request);
            return ResponseEntity.ok("Product Updated Successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Update Failed: " + e.getMessage());
        }
    }

    // Disable/Enable Product
    @PatchMapping("/status/{id}")
    public ResponseEntity<String> toggleStatus(@PathVariable Long id, @RequestParam boolean isActive) {
        try {
            catalogService.toggleProductStatus(id, isActive);
            return ResponseEntity.ok("Product Status Changed to: " + (isActive ? "Active" : "Disabled"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}