package com.routely.user_service.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import com.routely.shared.enums.SessionState;
import com.routely.user_service.dto.AuthRequest;
import com.routely.user_service.dto.AuthResponse;
import com.routely.user_service.dto.VehicleDto;
import com.routely.user_service.model.ActorSession;
import com.routely.user_service.model.User;
import com.routely.user_service.model.Vehicle;
import com.routely.user_service.repository.ActorSessionRepository;
import com.routely.user_service.repository.UserRepository;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ActorSessionService actorSessionService;
	
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
		actorSessionService.updateSessionState(user.getId(), SessionState.IDLE);
		return new AuthResponse(user, "Successfully register user.", SessionState.IDLE);
	}

	public AuthResponse login(AuthRequest request) throws Exception {
		return userRepository.findByEmail(request.getEmail()).map(user -> {
			if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
				SessionState state = actorSessionService.getActorState(user.getId());
				return new AuthResponse(user, "Login successful!", state);
			} else {
				throw new RuntimeException("Invalid credentials!");
			}
		}).orElseThrow(() -> new RuntimeException("User not found!"));
	}	
	
    public List<VehicleDto> addVehicle(VehicleDto request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found!");
        }

        User user = userOpt.get();

        Vehicle vehicle = new Vehicle();
        vehicle.setType(request.getType());
        vehicle.setCapacity(request.getCapacity());
        vehicle.setRegistrationNo(request.getRegistrationNo());
        vehicle.setUser(user);
        vehicle.setModel(request.getModel());

        user.getVehicles().add(vehicle);
        userRepository.save(user);
        
        return user.getVehicles().stream()
                .map(VehicleDto::new)
                .collect(Collectors.toList());
    }
    


	public List<VehicleDto> updateVehicle(VehicleDto request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found!");
        }

        User user = userOpt.get();
        
        Vehicle vehicleToUpdate = user.getVehicles().stream()
                .filter(v -> v.getId().equals(request.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Vehicle not found!"));

        vehicleToUpdate.setType(request.getType());
        vehicleToUpdate.setCapacity(request.getCapacity());
        vehicleToUpdate.setRegistrationNo(request.getRegistrationNo());
        vehicleToUpdate.setModel(request.getModel());

        userRepository.save(user);
        
        return user.getVehicles().stream()
                .map(VehicleDto::new)
                .collect(Collectors.toList());
	}    
	
	public List<VehicleDto> deleteVehicle(VehicleDto request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found!");
        }

        User user = userOpt.get();
        
        Vehicle vehicleToDelete = user.getVehicles().stream()
                .filter(v -> v.getId().equals(request.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Vehicle not found!"));

        user.getVehicles().remove(vehicleToDelete);
        userRepository.save(user);
        
        return user.getVehicles().stream()
                .map(VehicleDto::new)
                .collect(Collectors.toList());
	} 	
	
	
    public List<VehicleDto> fetchVehicles(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found!");
        }

        User user = userOpt.get();
        
        return user.getVehicles().stream()
                .map(VehicleDto::new)
                .collect(Collectors.toList());
    }
}
