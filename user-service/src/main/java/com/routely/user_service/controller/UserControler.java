package com.routely.user_service.controller;



import org.apache.hc.core5.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.routely.user_service.controller.utils.AesUtil;
import com.routely.user_service.controller.utils.CookieUtil;
import com.routely.user_service.controller.utils.JwtUtil;
import com.routely.user_service.dto.AuthRequest;
import com.routely.user_service.dto.AuthResponse;
import com.routely.user_service.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class UserControler {
	private Logger logger = LoggerFactory.getLogger(UserControler.class);
	@Autowired
    private UserService userService;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private CookieUtil cookieUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) throws Exception {
    	HttpHeaders headers = new HttpHeaders();
    	AuthResponse authResponse = new AuthResponse();
    	try {
    		authResponse = userService.register(request);
    		String token = jwtUtil.generateToken(authResponse);
    		String encryptedToken = AesUtil.encrypt(token);
    		authResponse.setJwtToken(encryptedToken);
    		headers.add(HttpHeaders.SET_COOKIE, cookieUtil.createCookie("RoutelyToken", encryptedToken).toString());
    		return ResponseEntity.ok(authResponse);
			
		} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    		authResponse.setMessage("Error occured - " + e.getLocalizedMessage());
    		ResponseEntity.status(HttpStatus.SC_EXPECTATION_FAILED).body(authResponse);
    	}
    	authResponse.setMessage("User registration Failed.");
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) throws Exception {
    	HttpHeaders headers = new HttpHeaders();
    	AuthResponse authResponse = new AuthResponse();
    	try {
    		authResponse = userService.login(request);
    		String token = jwtUtil.generateToken(authResponse);
    		String encryptedToken = AesUtil.encrypt(token);
    		authResponse.setJwtToken(encryptedToken);
    		headers.add(HttpHeaders.SET_COOKIE, cookieUtil.createCookie("RoutelyToken", encryptedToken).toString());
    		return ResponseEntity.ok(authResponse);
			
		} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    		authResponse.setMessage(e.getLocalizedMessage());
    	}
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(authResponse);
    	
    }
    
    @PostMapping("/authStatus")
    public ResponseEntity<AuthResponse> authStatus(HttpServletRequest req) throws Exception {
    	AuthResponse authResponse = new AuthResponse();
    	try {
    		String token = cookieUtil.extractTokenFromCookies(req);			
	    	if(token != null) {
	    		String decryptedToken = AesUtil.decrypt(token);
	    		authResponse = jwtUtil.extractClaims(decryptedToken);    		
	    		return ResponseEntity.ok(authResponse);
	    	}
    	} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    		authResponse.setMessage("Error occured - " + e.getLocalizedMessage());
    		return ResponseEntity.status(HttpStatus.SC_EXPECTATION_FAILED).body(authResponse);
    	}
    	authResponse.setMessage("User Auth Token not found.");
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(authResponse);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout() throws Exception {
    	AuthResponse res = new AuthResponse();
    	res.setJwtToken("");
        return ResponseEntity.ok(res);
    }      
}
