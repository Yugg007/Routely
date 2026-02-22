package com.routely.api_gateway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class KeystoreChecker implements ApplicationRunner {

    @Autowired 
    private Environment env;

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("===== SSL Configuration Check =====");
        
        // Keystore checks
        System.out.println("SYS javax.net.ssl.keyStore        = " + System.getProperty("javax.net.ssl.keyStore"));
        System.out.println("SYS javax.net.ssl.keyStorePassword= " + System.getProperty("javax.net.ssl.keyStorePassword"));
        System.out.println("SPRING server.ssl.key-store       = " + env.getProperty("server.ssl.key-store"));
        System.out.println("SPRING server.ssl.key-store-password = " + env.getProperty("server.ssl.key-store-password"));
        System.out.println("classpath keystore exists?        = " + new ClassPathResource("eureka-server-keystore.p12").exists());

        // Truststore checks
        System.out.println("SYS javax.net.ssl.trustStore        = " + System.getProperty("javax.net.ssl.trustStore"));
        System.out.println("SYS javax.net.ssl.trustStorePassword= " + System.getProperty("javax.net.ssl.trustStorePassword"));
        System.out.println("SPRING server.ssl.trust-store       = " + env.getProperty("server.ssl.trust-store"));
        System.out.println("SPRING server.ssl.trust-store-password = " + env.getProperty("server.ssl.trust-store-password"));
        System.out.println("classpath truststore exists?        = " + new ClassPathResource("eureka-server-truststore.p12").exists());

        System.out.println("===================================");
    }
}
