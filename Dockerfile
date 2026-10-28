# ==============================================================================
# AuthCore - Multi-Stage Enterprise Dockerfile
# Stage 1: Build React 19 Frontend with Node.js
# Stage 2: Compile & Package Spring Boot 4 / Java 21 Application with Maven
# Stage 3: Minimal, Hardened Alpine JRE 21 Runtime Container
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Frontend Build
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Backend Maven Build
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Cache Maven wrapper and dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline -B

# Copy backend source code
COPY src/ src/

# Overlay freshly built frontend static bundles into Spring Boot static resources
COPY --from=frontend-builder /src/main/resources/static/ src/main/resources/static/

RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 3: Hardened Runtime Image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Non-root user for principle of least privilege
RUN addgroup -S authcore && adduser -S authcore -G authcore
USER authcore:authcore

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
