package com.routely.shared.enums;

public enum SessionState {
    // Shared / Initial
    IDLE, 

    // Rider Specific
    MATCHING,               // Looking for drivers
    WAITING_FOR_DRIVER,     // Driver assigned, moving to pickup
    DRIVER_ARRIVED,         // Driver is at the curb
    
    // Driver Specific
    OFFERED,                // Driver is looking at a request ping
    ACCEPTED,               // Driver agreed to the ride
    
    // Active Trip (Both)
    ON_TRIP,                // Trip started, passenger in car
    
    // Finalization (Both)
    PAYMENT_PENDING,        // Processing transaction
    POST_RIDE,              // Showing summary / rating screen
    
    // Error/Cleanup
    CANCELLED               // Terminal state before returning to IDLE
}