# ==============================================================================
# AuthCore - Multi-Stage Dockerfile
# Stage 1: Build JAR using Maven with Temurin JDK 21
# Stage 2: Minimal Distroless / Alpine JRE 21 Runtime
# ==============================================================================

FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Cache Maven wrapper and dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline -B

# Copy source code and build production jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Runtime image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Add a non-root system user for security
RUN addgroup -S authcore && adduser -S authcore -G authcore
USER authcore:authcore

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
