package com.thalasi.tverse.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. PUBLIC GATES: Open access for authorization, static assets, and Swagger UI Docs
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/product_upload_template.xlsx"
                        ).permitAll()
                        .requestMatchers("/**/*.xlsx", "/**/*.csv", "/**/*.ico", "/**/*.png").permitAll()

                        // 2. FINANCIAL & STRATEGIC ANALYTICS: Dynamic Lambda parameter-matching guards
                        .requestMatchers(req -> "/api/reports/download".equals(req.getServletPath()) &&
                                ("ABC_CLASSIFICATION".equals(req.getParameter("type")) ||
                                        "DEAD_STOCK".equals(req.getParameter("type")) ||
                                        "ATTENDANCE_LOG".equals(req.getParameter("type")))
                        ).hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                        .requestMatchers(req -> "/api/reports/download".equals(req.getServletPath()) &&
                                ("ALL_STOCK".equals(req.getParameter("type")) ||
                                        "CATALOG_TEMPLATE".equals(req.getParameter("type")))
                        ).hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER", "EMPLOYEE")

                        // 3. CATALOG & EXECUTIVE MANAGEMENT: Restricted to corporate administrative tiers
                        .requestMatchers("/api/catalog/analytics/trigger-abc", "/api/catalog/analytics/trigger-stockout",
                                "/api/catalog/analytics/abc", "/api/catalog/analytics/liquidation",
                                "/api/catalog/analytics/sales-overview").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                        // 4. ORDER & LOGISTICS OPERATIONS PIPELINE
                        .requestMatchers("/api/orders/search", "/api/orders/flow/list", "/api/orders/flow/counts", "/api/orders/flow/filter").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER", "EMPLOYEE")
                        .requestMatchers("/api/orders/generate-picklist", "/api/orders/picklist/**", "/api/orders/flow/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                        // 5. STAFF ACCOUNT & PERSONNEL LOGISTICS MANAGEMENT
                        .requestMatchers("/api/staff/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")
                        .requestMatchers("/api/attendance/staff/add").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                        // 6. METADATA DROPDOWN CONFIGURATION ROUTING PATHWAYS
                        .requestMatchers("/api/config/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER", "EMPLOYEE")

                        // 7. WAREHOUSE TERMINAL WMS PACKING & DISPATCH FLOWS
                        .requestMatchers("/api/dispatch/scan").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER", "EMPLOYEE")
                        .requestMatchers("/api/dispatch/logs").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                        // Fallback default catch-all: All other requests must be fully authenticated
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "https://*.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // FIX: Allowed all headers via wildcard configuration to prevent preflight browser handshake failures
        config.setAllowedHeaders(List.of("*"));

        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}