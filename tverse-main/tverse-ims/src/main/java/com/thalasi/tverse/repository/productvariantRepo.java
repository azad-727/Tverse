package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.productVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface productvariantRepo extends JpaRepository<productVariant, Long>{
    Optional<productVariant> findBySku(String sku);

    List<productVariant>findByProduct_id(Long productId);

}
