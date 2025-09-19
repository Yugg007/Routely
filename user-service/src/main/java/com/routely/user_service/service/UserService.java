package com.routely.user_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.routely.user_service.dto.AuthRequest;
import com.routely.user_service.dto.AuthResponse;
import com.routely.user_service.model.User;
import com.routely.user_service.repository.UserRepository;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public AuthResponse register(AuthRequest request) {
		if (userRepository.existsByEmail(request.getEmail())) {
			return new AuthResponse("Email already exists!");
		}
		if (userRepository.existsByMobileNo(request.getMobileNo())) {
			return new AuthResponse("Mobile number already exists!");
		}

		User user = new User.Builder().email(request.getEmail()).password(passwordEncoder.encode(request.getPassword()))
				.mobileNo(request.getMobileNo()).name(request.getName()).isDriver(request.getIsDriver()).build();

		userRepository.save(user);
		return new AuthResponse(request, "Successfully register user.");
	}

	public AuthResponse login(AuthRequest request) throws Exception {
		return userRepository.findByEmail(request.getEmail()).map(user -> {
			if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
				return new AuthResponse(user, "Login successful!");
			} else {
				throw new RuntimeException("Invalid credentials!");
			}
		}).orElseThrow(() -> new RuntimeException("User not found!"));
	}

}
