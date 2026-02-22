package com.routely.user_service.controller;



import java.util.ArrayList;
import java.util.List;

import org.apache.hc.core5.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import com.routely.user_service.dto.VehicleDto;
import com.routely.user_service.service.ActorSessionService;
import com.routely.user_service.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class UserControler {

	@Autowired
    private ActorSessionService actorSessionService;
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
	    		authResponse.setActorState(actorSessionService.getActorState(authResponse.getId()));
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
    public ResponseEntity<AuthResponse> logout(HttpServletRequest req) throws Exception {
    	HttpHeaders headers = new HttpHeaders();
    	AuthResponse authResponse = new AuthResponse();
    	headers.add(HttpHeaders.SET_COOKIE, cookieUtil.createCookie("RoutelyToken", "").toString());
    	return ResponseEntity.status(HttpStatus.SC_OK).headers(headers).body(authResponse);
    }
    
    @PostMapping("/addVehicle")
    public ResponseEntity<List<VehicleDto>> addVehicle(HttpServletRequest req, @RequestBody VehicleDto request) {
    	List<VehicleDto> pojos = new ArrayList<>();
    	try {
    		String token = cookieUtil.extractTokenFromCookies(req);
    		request.setEmail(jwtUtil.extractUsername(AesUtil.decrypt(token)));
    		pojos = userService.addVehicle(request);
    		return ResponseEntity.ok(pojos);
			
		} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    	}
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(pojos);    	
    }
    
    @PostMapping("/updateVehicle")
    public ResponseEntity<List<VehicleDto>> updateVehicle(HttpServletRequest req, @RequestBody VehicleDto request) {
    	List<VehicleDto> pojos = new ArrayList<>();
    	try {
    		String token = cookieUtil.extractTokenFromCookies(req);
    		request.setEmail(jwtUtil.extractUsername(AesUtil.decrypt(token)));
    		pojos = userService.updateVehicle(request);
    		return ResponseEntity.ok(pojos);
			
		} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    	}
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(pojos);    	
    }
    
    @PostMapping("/deleteVehicle")
    public ResponseEntity<List<VehicleDto>> deleteVehicle(HttpServletRequest req, @RequestBody VehicleDto request) {
    	List<VehicleDto> pojos = new ArrayList<>();
    	try {
    		String token = cookieUtil.extractTokenFromCookies(req);
    		request.setEmail(jwtUtil.extractUsername(AesUtil.decrypt(token)));
    		pojos = userService.deleteVehicle(request);
    		return ResponseEntity.ok(pojos);
			
		} catch (Exception e) {
    		logger.info("Error occured while getting authStatus", e.getLocalizedMessage());
    	}
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(pojos);    	
    }    
    
    @PostMapping("/fetchVehicles")
    public ResponseEntity<List<VehicleDto>> fetchVehicles(HttpServletRequest req) {
    	List<VehicleDto> pojos = new ArrayList<>();
    	try {
    		String token = cookieUtil.extractTokenFromCookies(req);
    		String email = jwtUtil.extractUsername(AesUtil.decrypt(token));
    		pojos = userService.fetchVehicles(email);
    		return ResponseEntity.ok(pojos);
			
		} catch (Exception e) {
    		logger.info("Error occured while fetching vehicles", e.getLocalizedMessage());
    	}
    	return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(pojos);    	
    }    
}
