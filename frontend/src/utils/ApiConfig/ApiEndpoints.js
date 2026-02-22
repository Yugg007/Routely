const ApiEndpoints = {
    // Spring Backend API Endpoints
    "register" : "/users/register",
    "login" : "/users/login",
    "authStatus" : "/users/authStatus" ,
    "logout" : "/users/logout",
    "addVehicle" : "/users/addVehicle",
    "updateVehicle" : "users/updateVehicle",
    "deleteVehicle" : "users/deleteVehicle",
    "fetchVehicles" : "/users/fetchVehicles",

    // User Perspective
    "estimateFare" : "/trips/user/estimateFare",
    "requestRide" : "/trips/user/requestRide",
    "userRideDetails" : "/trips/user/rideDetails",
    "cancelRide" : "/trips/user/cancelRide",

    // Driver Perspective
    "acceptRide" : "/trips/driver/acceptRide",
    "completeRide" : "/trips/completeRide",
    "getTripHistory" : "/trips/getTripHistory",
    "getActiveTrips" : "/trips/getActiveTrips",
    "driverRideDetails" : "/trips/driver/rideDetails",


    "locationSocket" : "/ws/location",
    "driverSocket" : "/ws/driver-socket",
    // "userSocket" : "/ws/user-socket",


    //Pin Detail
    "getPinDetails" : "/trips/user/getPinDetails",
    "verifyPin" : "/trips/driver/verify-pin"
}

export default ApiEndpoints;