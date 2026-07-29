package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.productVariant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ProductVariantRepo extends JpaRepository<productVariant, Long>{

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
    List<productVariant> findBySkuIn(List<String> skus);

    @Query("SELECT pv FROM productVariant pv "+
            "JOIN FETCH pv.product p "+
            "LEFT JOIN FETCH p.category "+
            "LEFT JOIN FETCH p.brand "+
            "WHERE pv.id> :cursorId "+
            "ORDER BY pv.id ASC")
    Slice<productVariant> findNextPageProduct(@Param("cursorId") Long cursorId, Pageable pageable);

    @Query("SELECT pv FROM productVariant pv "+
            "JOIN FETCH pv.product p "+
            "LEFT JOIN FETCH p.category "+
            "LEFT JOIN FETCH p.brand "+
            "ORDER BY pv.id ASC")
    Slice<productVariant> findFirstPageProduct(Pageable pageable);

    @Query("SELECT pv from productVariant pv "+
    "JOIN FETCH pv.product p "+
    "LEFT JOIN FETCH p.category "+
    "LEFT JOIN FETCH p.brand "+
    "WHERE (LOWER(pv.sku) LIKE LOWER(:productSku) "+
    "OR LOWER(p.name) LIKE LOWER(:productTitle)) "+
    "ORDER BY pv.id ASC")
    Slice<productVariant> findFirstPageProductSearch(@Param("productSku") String productSku,@Param("productTitle") String productTitle,Pageable pageable);

    @Query("SELECT pv from productVariant pv "+
    "JOIN FETCH pv.product p "+
    "LEFT JOIN FETCH p.category "+
    "LEFT JOIN FETCH p.brand "+
    "WHERE (LOWER(pv.sku) LIKE LOWER(:productSku) "+
    "OR LOWER(p.name) LIKE LOWER(:productTitle)) "+
    "AND pv.id> :cursorId "+
    "ORDER BY pv.id ASC")
    Slice<productVariant> findNextPageProductSearch(@Param("cursorId")Long cursorId,@Param("productSku") String productSku,@Param("productTitle") String productTitle,Pageable pageable);
}
