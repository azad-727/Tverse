package com.thalasi.tverse.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map URL "http://localhost:8080/uploads/..." to the local "uploads" folder
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

   @Override
    public void addCorsMappings(CorsRegistry registry){
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "https://your-vercel-app-url.vercel.app" // REPLACE THIS with your actual Vercel URL
                )
                .allowedMethods("GET","PUT","POST","DELETE","OPTIONS","PATCH")
                .allowedHeaders("*")
                .allowCredentials(true); // Required if you are sending cookies or auth headers
    }
}
