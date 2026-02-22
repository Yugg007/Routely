package com.routely.api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

import reactor.core.publisher.Mono;


@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}
	
	@Bean
	public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
		return builder.routes()
		        .route("trip-service", r -> r
		            .path("/trips/**")
		            .filters(f -> f
		                .stripPrefix(1)
		                .modifyRequestBody(String.class, String.class, (exchange, body) -> {
		                    // Logic to extract RideRequest from 'body'
		                    System.out.println("Payload in Gateway: " + body);
		                    return Mono.just(body); 
		                })
		            )
		            .uri("lb://TRIP-SERVICE"))
		        .build();
	}

}
