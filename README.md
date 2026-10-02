# Routely

Routely is a full-stack ride-booking and live-ride tracking platform built with a React frontend and a set of Spring Boot microservices. It supports user and driver flows, secure authentication, ride requests, live location updates, trip management, and real-time communication through WebSockets and Kafka.

## Overview

This repository contains the complete application stack for a ride-sharing-style system:

- Frontend web app for riders and drivers
- API Gateway for routing and JWT-based security
- Eureka service registry for discovery
- User Service for authentication, user management, and driver state
- Trip Service for ride lifecycle, fare estimation, and persistence
- WebSocket Service for real-time ride and location updates
- Shared library for common DTOs, enums, constants, and utilities

## Tech Stack

### Frontend
- React 19
- Vite
- Redux Toolkit
- React Router DOM
- Axios
- Google Maps integration
- WebSocket / realtime client libraries

### Backend
- Java 21
- Spring Boot 3.5
- Spring Cloud Gateway
- Spring Cloud Netflix Eureka
- Spring Security
- JWT authentication
- MySQL
- Redis
- Apache Kafka
- WebFlux / WebSocket support

### Infrastructure
- Docker Compose
- Docker-based local environment orchestration

## System Architecture

The frontend communicates only through the API Gateway. The gateway is the single public entry point for web clients and resolves downstream service locations from Eureka before forwarding traffic. The User Service, Trip Service, and WebSocket Service all register themselves with Eureka, and the gateway uses that registry to discover the active instances for each request.

Inside the backend, the services communicate through a pub/sub model using Kafka. Ride events, user state changes, location updates, and trip transitions are published to topics and consumed by interested services. Redis is used for fast access to session data, ride state, driver locations, and other real-time operational data that must be queried frequently.

```text
┌──────────────────────────────┐
│        Frontend             │
│    React + Vite UI          │
└──────────────┬──────────────┘
               │
               │ HTTPS / REST only
               ▼
┌──────────────────────────────┐
│       API Gateway            │
│  Spring Cloud Gateway        │
│  JWT validation + routing    │
│  queries Eureka for targets  │
└──────────────┬──────────────┘
               │
               │ service discovery via Eureka
               ▼
┌──────────────────────────────┐
│          Eureka Server       │
│  service registry / discovery│
└──────────────┬──────────────┘
               │
      ┌────────┼────────┬────────┐
      │        │        │        │
      ▼        ▼        ▼        ▼
┌────────────┐ ┌────────────┐ ┌──────────────┐
│ User       │ │ Trip       │ │ WebSocket    │
│ Service    │ │ Service    │ │ Service      │
│ registers  │ │ registers  │ │ registers    │
│ on Eureka  │ │ on Eureka  │ │ on Eureka    │
└─────┬──────┘ └─────┬──────┘ └──────┬───────┘
      │               │                │
      └───────────────┼────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   Kafka      │
              │ Pub/Sub bus  │
              │ ride events  │
              │ state updates│
              │ locations   │
              └──────┬───────┘
                     │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ Redis         │ │ Redis         │ │ Redis         │
 │ User state    │ │ Ride state    │ │ Location      │
 │ session data  │ │ pending rides│ │ driver geo    │
 └──────────────┘ └──────────────┘ └──────────────┘

Notes:
- Frontend never calls User/Trip/WebSocket services directly.
- Gateway resolves service instances through Eureka before forwarding requests.
- User, Trip, and WebSocket services exchange real-time business events via Kafka.
- Redis is the fast-access store for ride, user, and location state.
- WebSocket service also provides live socket connections for clients.
```

## Core Features

- Rider sign-up and login
- Driver registration and ride state handling
- Ride request creation
- Driver matching and ride offer workflow
- Real-time trip notifications over WebSockets
- Driver location tracking
- Fare estimation and trip completion flow
- Event-driven communication using Kafka
- Service discovery through Eureka
- Secure API routing at the gateway layer

## Repository Structure

```text
Routely/
├── api-gateway/                # Spring Cloud Gateway
├── eureka-server/              # Discovery server
├── frontend/                   # React/Vite application
├── RoutelyCommon/              # Shared Java library
├── trip-service/               # Ride/trip orchestration
├── user-service/               # Authentication and user logic
├── websocket-service/           # Real-time ride communication
├── docker-compose.yml          # Full stack local environment
├── .gitignore
├── .env.example (if present in your environment)
└── README.md
```

## Prerequisites

Before running the project locally, install:

- Java 21+
- Maven
- Node.js 18+
- npm
- Docker Desktop or Docker Engine + Compose
- A working terminal environment with access to localhost ports

## Quick Start with Docker Compose

The easiest way to start the full system is with Docker Compose.

### 1. Build the shared Java module

```bash
cd RoutelyCommon
./mvnw clean install
cd ..
```

### 2. Start the full stack

```bash
docker compose up --build
```

This starts the infrastructure and services in dependency order:

- MySQL
- Redis
- Kafka
- Eureka
- User Service
- Trip Service
- WebSocket Service
- API Gateway
- Frontend

### 3. Access the application

Once the containers are running, use these URLs:

- Frontend: http://localhost:8001
- API Gateway: https://localhost:8002
- User Service: https://localhost:8003
- WebSocket Service: https://localhost:8004
- Trip Service: https://localhost:8005
- Eureka Dashboard: https://localhost:8761

> The gateway and backend services use self-signed certificates, so your browser may warn you the first time you open them. Accept the certificate warning for local development.

## Running the Frontend Manually

If you want to run only the React application outside Docker:

```bash
cd frontend
npm install
npm run dev
```

The app will be available on the Vite dev server, often at:

- http://localhost:5173

## Local Backend Development

Each Spring service can also be run locally via Maven.

Example:

```bash
cd user-service
./mvnw spring-boot:run
```

Similarly:

```bash
cd trip-service
./mvnw spring-boot:run
```

```bash
cd websocket-service
./mvnw spring-boot:run
```

```bash
cd api-gateway
./mvnw spring-boot:run
```

```bash
cd eureka-server
./mvnw spring-boot:run
```

## Environment Variables

The Docker Compose setup uses environment variables for configuration, including:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `JWT_SECRET`
- `AES_KEY`
- `SPRING_PROFILES_ACTIVE`

Typical defaults are defined in the compose file, but for production use you should replace them with secure values.

## Default Services and Ports

| Service | Port |
|---|---:|
| Frontend | 8001 |
| API Gateway | 8002 |
| User Service | 8003 |
| WebSocket Service | 8004 |
| Trip Service | 8005 |
| Eureka Server | 8761 |
| MySQL | 3306 |
| Redis | 6379 |
| Kafka | 9092 |

## Typical Ride Flow

1. A rider signs in through the frontend and sends the request to the API Gateway.
2. The gateway resolves the correct service instance from Eureka and routes the request to the User or Trip Service as needed.
3. The Trip Service validates the ride request and stores or updates ride state in Redis.
4. Driver location data and ride-related state are maintained in Redis for fast matchmaking and tracking.
5. User, Trip, and WebSocket services publish and consume Kafka events for ride requests, offers, acceptances, cancellations, and trip lifecycle changes.
6. The WebSocket Service streams live updates to connected rider and driver clients in real time.
7. Trip completion, status transitions, and final state updates are persisted and emitted back through the event pipeline.

## Common Commands

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Tail logs for one service
docker compose logs -f trip-service

# Rebuild a single service
docker compose up --build trip-service
```

## Troubleshooting

### Maven shared dependency issue

If a Spring service cannot resolve the shared module, run:

```bash
cd RoutelyCommon
./mvnw clean install
```

### Docker build issues

Ensure the Docker daemon is running and that the project root is the current working directory.

### HTTPS certificate warnings

This project uses local self-signed certificates for Spring services. Accept the browser warning or use curl with `-k` for direct terminal checks.

### Database or Redis startup problems

Check the service health and logs:

```bash
docker compose logs mysql
docker compose logs redis
docker compose logs kafka
```

## Production Notes

This repository is configured for local development and demonstration. Before production deployment, update:

- JWT secrets
- AES encryption keys
- database credentials
- TLS/certificate setup
- environment-specific configuration
- monitoring and alerting

## License

This project does not currently declare a specific license in the repository. If you plan to distribute or use it commercially, confirm the licensing terms before publishing.

## Contributing

Contributions are welcome. The recommended workflow is:

1. Create a branch for your feature or fix.
2. Keep service changes scoped and testable.
3. Verify both frontend and backend behavior before making a PR.
4. Update the documentation when behavior or setup changes.

## Summary

Routely is a microservice-based ride-sharing application that combines secure API routing, live location tracking, event-driven communication, and a modern frontend. It is designed to demonstrate a realistic distributed system architecture for local development and experimentation.
