package com.routely.websocket_service.interceptor;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.routely.websocket_service.utils.AesUtil;
import com.routely.websocket_service.utils.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class AuthHandshakeInterceptor implements HandshakeInterceptor{
	@Autowired
	private JwtUtil jwtUtil;

	@Override
	public boolean beforeHandshake(ServerHttpRequest request,
	                               ServerHttpResponse response,
	                               WebSocketHandler wsHandler,
	                               Map<String, Object> attributes) throws Exception {
	    System.out.println("Came to interceptor ✅");

	    if (request instanceof ServletServerHttpRequest) {
	        HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();

	        if (servletRequest.getCookies() != null) {
	            for (Cookie cookie : servletRequest.getCookies()) {
	                if ("RoutelyToken".equals(cookie.getName())) {
	                    String token = AesUtil.decrypt(cookie.getValue());
	                    String ID = jwtUtil.extractId(token);
	                    
	                    // TODO: decode driverId from token
	                    attributes.put("ID", ID);
	                }
	            }
	        }
	    }

		return true;
	}


	@Override
	public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
			org.springframework.http.server.ServerHttpResponse response, WebSocketHandler wsHandler,
			Exception exception) {
		// TODO Auto-generated method stub
		
	}
}
