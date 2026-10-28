package com.authcore.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI authCoreOpenAPI() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
            .info(new Info()
                .title("AuthCore API")
                .description("""
                    ## Production-Grade Authentication & User Management API
                    
                    **AuthCore** is a fully-featured authentication system built with Spring Boot 4, PostgreSQL, Redis, and JWT.
                    
                    ### Features
                    - 🔐 JWT Authentication (Access + Refresh token rotation)
                    - 👥 Full User Management with pagination & filtering
                    - 🛡️ Role-Based Access Control (RBAC) with permissions
                    - 🔒 Rate Limiting (IP-based + Account-based)
                    - 📋 Append-only Audit Logs
                    - 🔑 Password History Enforcement (last 5 passwords)
                    - 📧 Password Reset via email token
                    
                    ### Quick Start
                    1. **Register** a user via `POST /api/v1/auth/register`
                    2. **Login** via `POST /api/v1/auth/login` to get your `accessToken`
                    3. Click **Authorize** 🔓 above and paste: `<your accessToken>`
                    4. Explore all protected endpoints!
                    
                    ### Default Dev Accounts
                    | Role | Email | Password |
                    |------|-------|----------|
                    | Super Admin | superadmin@authcore.io | AdminPassword123! |
                    | User | john.doe@example.com | Password123! |
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("Soham Patil")
                    .url("https://github.com/Soham6888/authcore"))
                .license(new License()
                    .name("MIT License")
                    .url("https://opensource.org/licenses/MIT")))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Paste your JWT access token here (obtained from POST /api/v1/auth/login)")));
    }
}
