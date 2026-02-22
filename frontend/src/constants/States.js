const STATE = {
    DRIVER_STATES: {
        OFFLINE: "OFFLINE",                      // Driver is not working.
        ONLINE_IDLE: "IDLE",                     // Online, no active ride, waiting for requests.
        ACCEPTED: "ACCEPTED",                    // Accepted a ride, moving toward pickup.
        DRIVER_ARRIVED: "DRIVER_ARRIVED",        // At the pickup location, waiting for passenger.
        ON_TRIP: "ON_TRIP",                      // Passenger is in the car, moving to destination.
        PAYMENT_PENDING: "PAYMENT_PENDING",      // Trip ended, waiting for payment/rating completion.
        ON_BREAK: "ON_BREAK"                     // Online but not accepting new rides (Optional).
    },
    USER_STATES : {
        IDLE: "IDLE",                           // User is not requesting a ride.
        MATCHING : "MATCHING",                     // User has requested a ride, waiting for driver acceptance.
        WAITING_FOR_DRIVER : "WAITING_FOR_DRIVER",   // Driver accepted, waiting for driver to arrive.
        ON_TRIP : "ON_TRIP",                      // User is in the car, moving to destination.
        PAYMENT_PENDING : "PAYMENT_PENDING",       // Trip ended, waiting for payment/rating completion.
        POST_RIDE : "POST_RIDE"                      // After trip completion, showing summary and rating.
    },

    STATE_CHANGE : "STATE_CHANGE"
};


export default STATE;