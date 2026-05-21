package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.productVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface productvariantRepo extends JpaRepository<productVariant, Long>{

    @Query("SELECT pv FROM productVariant pv " +
            "JOIN FETCH pv.product p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.brand " +
            "WHERE pv.sku = :sku")
    Optional<productVariant> findBySkuWithFullProduct(@Param("sku") String sku);
    @Query("SELECT pv FROM productVariant pv " +
            "JOIN FETCH pv.product p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.brand")
    List<productVariant> findAllWithFullProduct();

    List<productVariant> findByProduct_id(Long productId);

    Optional<productVariant> findBySku(String sku);
}
