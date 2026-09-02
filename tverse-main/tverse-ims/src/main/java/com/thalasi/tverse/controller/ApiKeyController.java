package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.ApiKey;
import com.thalasi.tverse.repository.ApiKeyRepository;
import com.thalasi.tverse.service.ApiKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/keys")
@CrossOrigin(origins = "*")

public class ApiKeyController {

    @Autowired
    private ApiKeyService apiKeyService;

    @Autowired
    private ApiKeyRepository apiKeyRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<?> generateKey(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String role = body.getOrDefault("role", "EMPLOYEE");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "name is required"));
        }

        Map<String, Object> result = apiKeyService.generateApiKey(name, role);

        return ResponseEntity.ok(Map.of(
                "message", "API key generated successfully. Copy the key now — it will not be shown again.",
                "key", result.get("rawKey"),
                "prefix", ((ApiKey) result.get("apiKey")).getKeyPrefix(),
                "role", role
        ));
    }
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<List<ApiKey>> listKeys() {
        return ResponseEntity.ok(apiKeyRepository.findAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OWNER')")
    public ResponseEntity<?> revokeKey(@PathVariable Long id) {
        apiKeyService.revokeKey(id);
        return ResponseEntity.ok(Map.of("message", "API key revoked successfully"));
    }
}
