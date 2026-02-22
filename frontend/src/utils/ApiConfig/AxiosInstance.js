import axios from "axios";
import Property from "../../constants/Property";

const SpringBackendInstance = axios.create({
  baseURL: Property.SpringBackendPath, // Replace with your Spring Boot base URL
  withCredentials: true
});

const NodeBackendInstance = axios.create({
  baseURL: Property.NodeBackendPath, // Replace with your Node.js base URL
  withCredentials: true
});

export { SpringBackendInstance, NodeBackendInstance };