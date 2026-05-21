package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.ProductBundle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBundleRepo extends JpaRepository<ProductBundle,Long> {
    List<ProductBundle> findByComboSku(String resolveSku);
}
