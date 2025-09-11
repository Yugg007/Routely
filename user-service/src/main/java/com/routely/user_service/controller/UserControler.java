package com.routely.user_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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
	@Autowired
    private UserService userService;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private CookieUtil cookieUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) throws Exception {
    	HttpHeaders headers = new HttpHeaders();
    	AuthResponse res = userService.register(request);
    	headers.add(HttpHeaders.SET_COOKIE, cookieUtil.createCookie("RoutelyToken", AesUtil.encrypt(jwtUtil.generateToken(res.getEmail()))).toString());
        return ResponseEntity.ok().headers(headers).body(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) throws Exception {
    	HttpHeaders headers = new HttpHeaders();
    	AuthResponse res = userService.login(request);
    	String token = AesUtil.encrypt(jwtUtil.generateToken(res.getEmail()));
    	res.setJwtToken(token);
    	headers.add(HttpHeaders.SET_COOKIE, cookieUtil.createCookie("RoutelyToken", token).toString());
        return ResponseEntity.ok(res);
    }
    
    @PostMapping("/authStatus")
    public ResponseEntity<String> authStatus(HttpServletRequest req) throws Exception {
    	String username = jwtUtil.extractUsername(AesUtil.decrypt(cookieUtil.extractTokenFromCookies(req)));
        return ResponseEntity.ok(username);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout() throws Exception {
    	AuthResponse res = new AuthResponse();
    	res.setJwtToken("");
        return ResponseEntity.ok(res);
    }      
}
