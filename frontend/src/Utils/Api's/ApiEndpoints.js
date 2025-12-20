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

    // Driver Perspective
    "acceptRide" : "/trips/driver/acceptRide",
    "cancelRide" : "/trips/cancelRide",
    "completeRide" : "/trips/completeRide",
    "getTripHistory" : "/trips/getTripHistory",
    "getActiveTrips" : "/trips/getActiveTrips",


    "locationSocket" : "/ws/location",
    "driverSocket" : "/ws/driver-socket",
    "userSocket" : "/ws/user-socket",
}

export default ApiEndpoints;