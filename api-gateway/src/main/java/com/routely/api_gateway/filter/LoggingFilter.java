package com.routely.api_gateway.filter;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

	private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		logger.info("Incoming request: {} {}", exchange.getRequest().getMethod(), exchange.getRequest().getURI());
		logger.info("Request headers: {}", exchange.getRequest().getHeaders());

		ServerHttpResponse originalResponse = exchange.getResponse();

		ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(originalResponse) {
			@Override
			public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
				// handle Flux<DataBuffer> (streamed body)
				if (body instanceof Flux) {
					Flux<? extends DataBuffer> fluxBody = (Flux<? extends DataBuffer>) body;

					// join buffers into a single buffer (important for chunked JSON)
					return DataBufferUtils.join(fluxBody).flatMap(dataBuffer -> {
						try {
							byte[] bytes = new byte[dataBuffer.readableByteCount()];
							dataBuffer.read(bytes);
							String responseBody = new String(bytes, StandardCharsets.UTF_8);

							logger.debug("Downstream response body (joined): {}", responseBody);

							// parse token - check both JwtToken and jwtToken keys
							String trimmed = responseBody.trim();
							if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
								// Looks like JSON
								try {
									JsonNode root = objectMapper.readTree(responseBody);
									JsonNode tokenNode = root.has("jwtToken") ? root.get("jwtToken")
											: (root.has("JwtToken") ? root.get("JwtToken") : null);

									if (tokenNode != null && !tokenNode.isNull()) {
										String jwtToken = tokenNode.asText();
										logger.info("Extracted jwtToken: {} (len={})", jwtToken, jwtToken.length());

										// determine if connection is secure (handle proxy via X-Forwarded-Proto)
										boolean isSecure = "https"
												.equalsIgnoreCase(exchange.getRequest().getURI().getScheme())
												|| "https".equalsIgnoreCase(exchange.getRequest().getHeaders()
														.getFirst("X-Forwarded-Proto"));

										// build cookie - for cross-site use SameSite=None and Secure=true (requires
										// https)
										ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie
												.from("RoutelyToken", jwtToken)
												.httpOnly(true)
												.path("/")
												.maxAge(Duration.ofHours(1));

										if (isSecure) {
											cookieBuilder.secure(true).sameSite("None");
										} else {
											// local dev over http -> cannot set SameSite=None without Secure in many
											// browsers
											cookieBuilder.secure(false).sameSite("Lax");
										}

										ResponseCookie cookie = cookieBuilder.build();

										// Add Set-Cookie header to **decorated response** headers (ensures it's sent)
										// Using cookie.toString() produces Set-Cookie header string
										this.getHeaders().add(HttpHeaders.SET_COOKIE, cookie.toString());
										logger.info("Added Set-Cookie header: {}", cookie.toString());
									}
								} catch (Exception e) {
									logger.warn("Failed to parse JSON or extract jwtToken", e);
								}
							}

							// If the request had an Origin header and it's a cross-origin scenario,
							// set Access-Control-Allow-Credentials: true and allow that origin.
							String origin = exchange.getRequest().getHeaders().getOrigin();
							if (origin != null) {
								// IMPORTANT: when credentials are allowed, the origin must NOT be "*"
								this.getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
								this.getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
								// Optionally expose headers (not required for cookies but ok)
								this.getHeaders().add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS,
										HttpHeaders.SET_COOKIE);
							}

							// update content-length if present (we didn't change body bytes, but safe to
							// set)
							this.getHeaders().setContentLength(bytes.length);

							DataBufferUtils.release(dataBuffer);
							DataBuffer buffer = originalResponse.bufferFactory().wrap(bytes);
							return super.writeWith(Mono.just(buffer));
						} catch (Exception ex) {
							DataBufferUtils.release(dataBuffer);
							logger.error("Error handling response body in LoggingFilter", ex);
							return super.writeWith(Mono.empty());
						}
					});
				}
				// fallback for Mono<DataBuffer> or other publishers
				return super.writeWith(body);
			}
		};

		return chain.filter(exchange.mutate().response(decoratedResponse).build());
	}

	@Override
	public int getOrder() {
		return -1;
	}
}
