package com.routely.trip_service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TripServiceApplication {

	public static void main(String[] args) {
		

	    System.out.println("========== JVM SSL BEFORE SPRING ==========");

	    System.out.println("javax.net.ssl.keyStore = "
	            + System.getProperty("javax.net.ssl.keyStore"));

	    System.out.println("javax.net.ssl.keyStorePassword = "
	            + System.getProperty("javax.net.ssl.keyStorePassword"));

	    System.out.println("javax.net.ssl.keyStoreType = "
	            + System.getProperty("javax.net.ssl.keyStoreType"));

	    System.out.println("javax.net.ssl.trustStore = "
	            + System.getProperty("javax.net.ssl.trustStore"));

	    System.out.println("javax.net.ssl.trustStorePassword = "
	            + System.getProperty("javax.net.ssl.trustStorePassword"));

	    System.out.println("javax.net.ssl.trustStoreType = "
	            + System.getProperty("javax.net.ssl.trustStoreType"));

	    System.out.println("============================================");
	    
		SpringApplication.run(TripServiceApplication.class, args);
	}
	
    @Bean
    CommandLineRunner sslConfig(Environment env) {
        return args -> {
            System.out.println("=== SSL CONFIG ===");
            System.out.println("server.ssl.enabled = " +
                    env.getProperty("server.ssl.enabled"));
            System.out.println("server.ssl.key-store = " +
                    env.getProperty("server.ssl.key-store"));
            System.out.println("server.ssl.trust-store = " +
                    env.getProperty("server.ssl.trust-store"));
            System.out.println("==================");
        };
    }

}
