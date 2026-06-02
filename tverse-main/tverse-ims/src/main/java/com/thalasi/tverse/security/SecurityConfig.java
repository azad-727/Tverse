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
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{

            http
                    .cors(cors-> cors.configurationSource(corsConfigurationSource()))
                    .csrf(csrf->csrf.disable())
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            // Expose public pathways cleanly (e.g. login endpoints)
                            .requestMatchers("/api/auth/**").permitAll()

                            // --- ROLE-BASED ACCESS CONTROL (RBAC) MATRIX RULES ---
                            // 1. Financial & Strategic Analytics: Restricted to Owners and Admin classes
                            .requestMatchers(req -> "/api/reports/download".equals(req.getServletPath()) &&
                                    ("ABC_CLASSIFICATION".equals(req.getParameter("type")) ||
                                            "DEAD_STOCK".equals(req.getParameter("type")) ||
                                            "ATTENDANCE_LOG".equals(req.getParameter("type")))
                            ).hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                            // 2. HR Management: Clear to Super Admin, Admin, and Owner tags
                            .requestMatchers("/api/reports/download?type=ATTENDANCE_LOG").hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER")

                            // Extra
                            .requestMatchers("/api/attendance/staff/add").hasAnyRole("SUPER_ADMIN","ADMIN","OWNER")

                            // 3. General Warehouse Operations: Accessible by Employees as well
                            .requestMatchers(req -> "/api/reports/download".equals(req.getServletPath()) &&
                                    ("ALL_STOCK".equals(req.getParameter("type")) ||
                                            "CATALOG_TEMPLATE".equals(req.getParameter("type")))
                            ).hasAnyRole("SUPER_ADMIN", "ADMIN", "OWNER", "EMPLOYEE")

                            // Fallback default catch-all: all other system calls require general validation clearance
                            .anyRequest().authenticated()
                    );

            http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            return http.build();
        }

    // Safe, straightforward raw String pin evaluator matching your entity pattern
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
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); // React context ports
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        config.setExposedHeaders(List.of("Content-Disposition")); // Crucial for file naming downloads!
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

}
