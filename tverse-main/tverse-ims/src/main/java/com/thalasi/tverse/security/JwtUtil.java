package com.thalasi.tverse.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;


@Component
public class JwtUtil {
    private final String SECRET_KEY_BASE64="YTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI3Y2hhbGFzaXR2ZXJzZWlwYm91bmRlcnNlY3VyaXR5bGF5ZXJrZXk=";
    private final long EXPIRATION_TIME_MS=1000*60*60*12;

    private SecretKey getSigningKey(){
        byte[] keyBytes= Decoders.BASE64.decode(SECRET_KEY_BASE64);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String phoneNumber, String role) {
        return Jwts.builder()
                .subject(phoneNumber)
                .claim("role", "ROLE_" + role.toUpperCase()) // Appends standard Spring prefix
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME_MS))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractPhoneNumber(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }
    public boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token, String phoneNumber) {
        return (extractPhoneNumber(token).equals(phoneNumber) && !isTokenExpired(token));
    }

}
