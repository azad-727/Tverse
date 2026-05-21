package com.thalasi.tverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class   TverseImsApplication {

        public static void main(String[] args) {
            SpringApplication.run(TverseImsApplication.class, args);
        }

}
