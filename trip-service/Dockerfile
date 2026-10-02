# --- Stage 1: Build ---
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# 1. Copy Maven wrapper from the gateway subfolder
COPY trip-service/.mvn/ .mvn/
COPY trip-service/mvnw trip-service/pom.xml ./

RUN chmod +x mvnw

# 2. Install routely-common (Path is now relative to Root)
COPY RoutelyCommon/target/routely-common-1.0.0.jar /tmp/routely-common.jar
RUN ./mvnw install:install-file \
      -Dfile=/tmp/routely-common.jar \
      -DgroupId=com.routely \
      -DartifactId=routely-common \
      -Dversion=1.0.0 \
      -Dpackaging=jar \
      -B

# 3. Build the Application
COPY trip-service/src ./src
# Removed -o for the first build to ensure it can reach Maven Central if needed
RUN ./mvnw clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Create a directory for certs
RUN mkdir -p /app/certs && addgroup -S routely && adduser -S routely -G routely

# Copy the JAR
COPY --from=builder /app/target/*.jar trip-service.jar

# ─── THE FIX: Copy files to a known physical path ───
COPY --from=builder /app/src/main/resources/trip-service.p12 /app/certs/keystore.p12
COPY --from=builder /app/src/main/resources/truststore.p12 /app/certs/truststore.p12

RUN chown -R routely:routely /app
USER routely

EXPOSE 8005

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-Djavax.net.ssl.trustStore=/app/certs/truststore.p12", \
  "-Djavax.net.ssl.trustStorePassword=routely123", \
  "-Djavax.net.ssl.trustStoreType=PKCS12", \
  "-jar", "trip-service.jar"]