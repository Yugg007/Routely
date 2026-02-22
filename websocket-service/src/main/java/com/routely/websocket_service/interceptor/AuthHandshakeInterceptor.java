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
import com.routely.shared.utils.Constants;
import com.routely.websocket_service.utils.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class AuthHandshakeInterceptor implements HandshakeInterceptor{
	@Autowired
	private JwtUtil jwtUtil;
	
	private final String ID = Constants.ID;

	@Override
	public boolean beforeHandshake(ServerHttpRequest request,
	                               ServerHttpResponse response,
	                               WebSocketHandler wsHandler,
	                               Map<String, Object> attributes) throws Exception {
	    
	    if (request instanceof ServletServerHttpRequest) {
	        HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();

	        if (servletRequest.getCookies() != null) {
	            for (Cookie cookie : servletRequest.getCookies()) {
	                if ("RoutelyToken".equals(cookie.getName())) {
	                    try {
	                        // 1. Decrypt and Extract
	                        String token = AesUtil.decrypt(cookie.getValue());
	                        String id = jwtUtil.extractId(token);

	                        // 2. Validate
	                        if (id != null && !id.isEmpty()) {
	                            attributes.put(ID, id);
	                            return true; // SUCCESS: Allow handshake
	                        }
	                    } catch (Exception e) {
	                        // Log decryption or parsing errors
	                        System.err.println("Auth failed: " + e.getMessage());
	                    }
	                }
	            }
	        }
	    }

	    // 3. REFUSE: If we reach here, no valid token was found
	    System.out.println("Handshake refused: No valid ID found...");
	    return false; 
	}


	@Override
	public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
			org.springframework.http.server.ServerHttpResponse response, WebSocketHandler wsHandler,
			Exception exception) {
		// TODO Auto-generated method stub
		
	}
}
