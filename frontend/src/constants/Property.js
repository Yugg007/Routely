// Change this variable to "localhost" or your IP "10.103.72.253" as needed
const BASE_HOST = "192.168.1.6"; 

const Property = {
    SpringBackendPath: `https://${BASE_HOST}:8002`,
    NodeBackendPath: `http://${BASE_HOST}:9004`,
    Driver_WS_URL: `wss://${BASE_HOST}:8002/ws/driver-socket`,
    User_WS_URL: `wss://${BASE_HOST}:8002/ws/user-socket`,
    Debug_WS_URL: `wss://${BASE_HOST}:8002/ws/location1`
};

export default Property;