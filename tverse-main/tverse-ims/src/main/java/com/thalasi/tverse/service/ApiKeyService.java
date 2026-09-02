package com.thalasi.tverse.service;

import com.thalasi.tverse.model.ApiKey;
import com.thalasi.tverse.repository.ApiKeyRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

import static org.apache.commons.codec.digest.DigestUtils.sha256;

@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    public Map<String,Object> generateApiKey(String name,String role){

        SecureRandom random=new SecureRandom();
        byte[] bytes=new byte[36];
        random.nextBytes(bytes);
        String rawKey="tviq_"+ Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        String keyHash = Arrays.toString(DigestUtils.sha256(rawKey));

        ApiKey apiKey = new ApiKey();
        apiKey.setName(name);
        apiKey.setKeyPrefix(rawKey.substring(0, Math.min(12, rawKey.length())));
        apiKey.setKeyHash(keyHash);
        apiKey.setRole(role.toUpperCase());
        apiKey.setActive(true);
        apiKeyRepository.save(apiKey);

        return Map.of("rawKey", rawKey, "apiKey", apiKey);

    }
    public Optional<ApiKey> validateKey(String rawKey) {
        String hash = Arrays.toString(DigestUtils.sha256(rawKey));
        Optional<ApiKey> found = apiKeyRepository.findByKeyHashAndActiveTrue(hash);

        // Update last_used_at timestamp
        found.ifPresent(key -> {
            key.setLastUsedAt(LocalDateTime.now());
            apiKeyRepository.save(key);
        });

        return found;
    }

    public void revokeKey(Long id) {
        apiKeyRepository.findById(id).ifPresent(key -> {
            key.setActive(false);
            apiKeyRepository.save(key);
        });
    }
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

}
