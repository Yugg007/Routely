package com.routely.eureka_server;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class KeystoreChecker implements ApplicationRunner {
    @Autowired Environment env;
    @Override
    public void run(ApplicationArguments args) {
        System.out.println("SYS javax.net.ssl.keyStore = " + System.getProperty("javax.net.ssl.keyStore"));
        System.out.println("SPRING server.ssl.key-store = " + env.getProperty("server.ssl.key-store"));
        System.out.println("classpath keystore exists? " + new org.springframework.core.io.ClassPathResource("eureka-server-keystore.p12").exists());
    }
}