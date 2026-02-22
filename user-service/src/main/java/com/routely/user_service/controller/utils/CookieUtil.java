package com.routely.user_service.controller.utils;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class CookieUtil {
	
    public String extractTokenFromCookies(HttpServletRequest request) {
    	System.out.println("US Cookie - " + request.getCookies());
    	System.out.println("US Header - " + request.getHeader("SET_COOKIE"));
    	System.out.println(request.getCookies());
        if (request.getCookies() == null) return null;

        for (Cookie cookie : request.getCookies()) {
            if ("RoutelyToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
    
    public ResponseCookie createCookie(String name, String value) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("None")   // Can change to Lax/Strict if needed
                .maxAge(1000*60*30)
                .build();
        return cookie;
    } 
}
