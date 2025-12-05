package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.inventoryLog;
import com.thalasi.tverse.model.product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface productRepo extends JpaRepository<product,Long> {
    List<product> findByCategoryName(String categoryName);
}
