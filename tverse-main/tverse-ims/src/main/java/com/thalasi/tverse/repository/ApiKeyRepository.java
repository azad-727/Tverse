package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey,Long> {
    Optional<ApiKey> findByKeyHashAndActiveTrue(String keyHash);
}
