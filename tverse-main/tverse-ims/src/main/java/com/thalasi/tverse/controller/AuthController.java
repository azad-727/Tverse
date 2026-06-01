package com.thalasi.tverse.controller;

import com.thalasi.tverse.dto.LoginRequest;
import com.thalasi.tverse.security.JwtUtil;
import com.thalasi.tverse.model.Staff;
import com.thalasi.tverse.repository.StaffRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private StaffRepo staffRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginReq) {
        // 1. Authenticate against your database properties via custom provider rules
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginReq.getPhoneNumber(), loginReq.getSecurityPin())
        );

        // 2. Fetch the staff details from your table to read their assigned role string securely
        Long phone = Long.parseLong(loginReq.getPhoneNumber().trim());
        Staff staff = staffRepo.findByPhoneNumber(phone)
                .orElseThrow(() -> new RuntimeException("Account execution error path anomaly."));

        // 3. Mint the cryptographically signed stateless string token
        String token = jwtUtil.generateToken(String.valueOf(staff.getPhoneNumber()), staff.getRole());

        // 4. Return structural access mappings back to the React context engine
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", staff.getRole(),
                "fullName", staff.getFullName()
        ));
    }
}