package com.thalasi.tverse.security;

import com.thalasi.tverse.model.ApiKey;
import com.thalasi.tverse.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {


    private static final String API_KEY_HEADER = "X-API-Key";

    @Autowired
    private ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String apiKeyHeader = request.getHeader(API_KEY_HEADER);
        if (apiKeyHeader != null
                && !apiKeyHeader.isBlank()
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Optional<ApiKey> validKey = apiKeyService.validateKey(apiKeyHeader);

            if (validKey.isPresent()) {
                ApiKey key = validKey.get();

                // IP allowlist check
                if (key.getAllowedIps() != null && !key.getAllowedIps().isBlank()) {
                    String clientIp = request.getRemoteAddr();
                    String[] allowed = key.getAllowedIps().split(",");
                    boolean ipMatch = false;
                    for (String ip : allowed) {
                        if (ip.trim().equals(clientIp)) {
                            ipMatch = true;
                            break;
                        }
                    }
                    if (!ipMatch) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.getWriter().write("{\"error\": \"IP not allowed for this API key\"}");
                        return;
                    }
                }

                // Set Spring Security authentication context
                String role = "ROLE_" + key.getRole().toUpperCase();
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                "api-key:" + key.getName(), // Principal identifier
                                null,
                                Collections.singletonList(authority)
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);

            } else {
                // Invalid API key — reject immediately
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Invalid or revoked API key\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
