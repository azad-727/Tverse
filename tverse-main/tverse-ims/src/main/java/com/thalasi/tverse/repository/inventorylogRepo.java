package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.inventoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface inventorylogRepo extends JpaRepository<inventoryLog,Long> {

List<inventoryLog> findByVariantSkuOrderByCreatedAtDesc(String sku);
    void deleteByVariant_Id(Long variantId);
}
