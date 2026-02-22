package com.routely.shared.utils;

import com.routely.shared.enums.ActorType;
import com.routely.shared.enums.SessionState;

public class SessionStateValidator {

    /**
     * Validates if a state transition is logically sound based on the actor type.
     * Use this before calling repository.save() to prevent corrupted sessions.
     */
    public static boolean isValidTransition(ActorType actorType, SessionState current, SessionState target) {
        // Universal Rule: Any state can move to IDLE (Cancellation/Reset)
        if (target == SessionState.IDLE) {
            return true;
        }

        return switch (actorType) {
            case DRIVER -> isValidDriverTransition(current, target);
            case USER -> isValidRiderTransition(current, target);
        };
    }

    private static boolean isValidDriverTransition(SessionState current, SessionState target) {
        return switch (current) {
            case IDLE -> target == SessionState.OFFERED;
            case OFFERED -> target == SessionState.ACCEPTED || target == SessionState.IDLE;
            case ACCEPTED -> target == SessionState.DRIVER_ARRIVED;
            case DRIVER_ARRIVED -> target == SessionState.ON_TRIP;
            case ON_TRIP -> target == SessionState.PAYMENT_PENDING;
            case PAYMENT_PENDING -> target == SessionState.POST_RIDE;
            case POST_RIDE -> target == SessionState.IDLE;
            default -> false;
        };
    }

    private static boolean isValidRiderTransition(SessionState current, SessionState target) {
        return switch (current) {
            case IDLE -> target == SessionState.MATCHING;
            case MATCHING -> target == SessionState.WAITING_FOR_DRIVER;
            case WAITING_FOR_DRIVER -> target == SessionState.DRIVER_ARRIVED;
            case DRIVER_ARRIVED -> target == SessionState.ON_TRIP;
            case ON_TRIP -> target == SessionState.PAYMENT_PENDING;
            case PAYMENT_PENDING -> target == SessionState.POST_RIDE;
            case POST_RIDE -> target == SessionState.IDLE;
            default -> false;
        };
    }
    
    public static boolean isValidStateForActor(ActorType type, SessionState state) {
        // IDLE and terminal trip states are generally shared
        if (state == SessionState.IDLE || 
        	state == SessionState.ON_TRIP || 
            state == SessionState.PAYMENT_PENDING ||
            state == SessionState.DRIVER_ARRIVED) {
            return true;
        }

        return switch (type) {
            case DRIVER -> 
                // Drivers handle the offering and acceptance phase
                state == SessionState.OFFERED || state == SessionState.ACCEPTED;

            case USER -> 
                // Riders handle the matching and waiting phase
                state == SessionState.MATCHING || state == SessionState.WAITING_FOR_DRIVER;
                
            default -> false;
        };
    }
}