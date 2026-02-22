package com.routely.trip_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.protobuf.ProtobufHttpMessageConverter;

import com.google.protobuf.DescriptorProtos.FeatureSet.JsonFormat;

@Configuration
public class ProtobufConfig {
    @Bean
    public ProtobufHttpMessageConverter protobufHttpMessageConverter() {
//    	String json = JsonFormat.printer().print(request);
//    	System.out.println(json);
        return new ProtobufHttpMessageConverter();
    }
}