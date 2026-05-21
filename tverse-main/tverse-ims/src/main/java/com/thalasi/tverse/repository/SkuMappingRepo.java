package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.SkuMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkuMappingRepo extends JpaRepository<SkuMapping,Long> {
    Optional<SkuMapping> findByChannelSku(String incomingSku);
}
