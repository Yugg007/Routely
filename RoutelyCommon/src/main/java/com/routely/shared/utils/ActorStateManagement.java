package com.routely.shared.utils;

import com.routely.shared.enums.ActorType;
import com.routely.shared.enums.SessionState;

public class ActorStateManagement {
	public static SessionState nextState(SessionState actorState, ActorType actorType) {
		if (actorType == ActorType.DRIVER) {
	        return getNextDriverState(actorState);
	    } else if (actorType == ActorType.USER) {
	        return getNextRiderState(actorState);
	    }
	    return SessionState.IDLE; // Fallback
	}

	private static SessionState getNextDriverState(SessionState current) {
	    return switch (current) {
	        // Driver is looking at a new ride request
	        case IDLE -> SessionState.OFFERED; 
	        
	        // Driver clicked 'Accept'
	        case OFFERED -> SessionState.ACCEPTED; 
	        
	        // Driver is physically at the pickup point
	        case ACCEPTED -> SessionState.DRIVER_ARRIVED; 
	        
	        // Passenger is in the car, trip started
	        case DRIVER_ARRIVED -> SessionState.ON_TRIP; 
	        
	        // Car reached destination, waiting for money
	        case ON_TRIP -> SessionState.PAYMENT_PENDING; 
	        
	        // Payment successful, driver can see summary
	        case PAYMENT_PENDING -> SessionState.POST_RIDE; 
	        
	        // Close summary, go back to looking for new work
	        default -> SessionState.IDLE;
	    };
	}

	private static SessionState getNextRiderState(SessionState current) {
	    return switch (current) {
	        case IDLE -> SessionState.MATCHING; 
	        
	        // Driver has accepted, is currently driving toward the user
	        case MATCHING -> SessionState.WAITING_FOR_DRIVER; 
	        
	        // Driver is within 50 meters of pickup (Trigger "Driver is here" push)
	        case WAITING_FOR_DRIVER -> SessionState.DRIVER_ARRIVED; 
	        
	        // Driver clicked "Start Trip" - User is now in the car
	        case DRIVER_ARRIVED -> SessionState.ON_TRIP; 
	        
	        // Trip ended, but we are waiting for the Stripe/PayPal webhook
	        case ON_TRIP -> SessionState.PAYMENT_PENDING; 
	        
	        // Payment success, show the "Rate your Driver" screen
	        case PAYMENT_PENDING -> SessionState.POST_RIDE; 
	        
	        default -> SessionState.IDLE;
	    };
	}

}
