package com.routely.trip_service.utils;

import java.security.SecureRandom;

public class PinUtil {
	public static String generateSecurePin() {
	    SecureRandom random = new SecureRandom();
	    int pin = 1000 + random.nextInt(9000); // Generates 4-digit PIN
	    return String.valueOf(pin);
	}

}
