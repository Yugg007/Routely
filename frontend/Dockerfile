FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY frontend/package.json frontend/package-lock.json* ./

# Use legacy-peer-deps to handle React 19 conflicts
RUN npm ci --legacy-peer-deps

COPY frontend/ . 

# Inject env vars
ARG VITE_API_BASE_URL=https://localhost:8002
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
# ... (rest of your Nginx config remains the same)

RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80