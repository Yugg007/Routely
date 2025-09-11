package com.routely.user_service.service;


import org.springframework.beans.factory.annotation.Autowired;
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
//    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse("Email already exists!", false, "");
        }
        if (userRepository.existsByMobileNo(request.getMobileNo())) {
            return new AuthResponse("Mobile number already exists!", false, "");
        }

        User user = new User.Builder()
                .email(request.getEmail())
//                .password(passwordEncoder.encode(request.getPassword()))
                .mobileNo(request.getMobileNo())
                .firstName("Yugg001")
                .build();

        userRepository.save(user);
        return new AuthResponse("User registered successfully!", true, user.getEmail());
    }

    public AuthResponse login(AuthRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                	return new AuthResponse("Login successful!", true, user.getEmail());
//                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
//                    } else {
//                        return new AuthResponse("Invalid credentials!", false, "");
//                    }
                })
                .orElse(new AuthResponse("User not found!", false, ""));
    }
}
