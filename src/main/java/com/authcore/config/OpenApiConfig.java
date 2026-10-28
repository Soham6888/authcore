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
                .title("AuthCore API — Interactive Testing Console")
                .description("""
                    ### 🎯 Welcome to the AuthCore Interactive API Console!
                    
                    > 💡 **New to Swagger?** Check out the [**Interactive 1-Click Guide & Playground**](/guide.html) for automatic 1-click token copying and live tutorials!
                    
                    ---
                    
                    ### 📋 3-Step Quickstart to Test Any Endpoint
                    
                    #### 1️⃣ Step 1: Get Your Token (Login)
                    Scroll down to the **Authentication** section below:
                    1. Click on **`POST /api/v1/auth/login`**.
                    2. In the **Request body**, the credentials for Super Admin are ready:
                    ```json
                    {
                      "email": "superadmin@authcore.io",
                      "password": "AdminPassword123!"
                    }
                    ```
                    3. Click the blue **Execute** button.
                    4. In the response below, copy the long text inside `"accessToken": "..."` (do **not** include the quotation marks).
                    
                    ---
                    
                    #### 2️⃣ Step 2: Unlock Swagger (Authorize)
                    1. Scroll up and click the glowing green **`Authorize 🔓`** button on the right.
                    2. In the **Value:** field, paste your `accessToken`.
                    3. Click **Authorize**, then click **Close**.
                    4. 🎉 **Done!** All lock icons are now closed **🔒** — you have unrestricted access.
                    
                    ---
                    
                    #### 3️⃣ Step 3: Test Role Management & User Endpoints
                    Now you can test any protected endpoint:
                    
                    * **Create a Role (`POST /api/v1/roles`):**
                    ```json
                    {
                      "name": "SECURITY_AUDITOR",
                      "description": "Compliance and audit log review officer",
                      "permissions": ["audit:read", "users:read", "sessions:read"]
                    }
                    ```
                    * **Assign Role to John Doe (`POST /api/v1/users/{id}/roles`):**
                      * Set `id` to: `ededffff-5b88-4a95-8e12-72f5b6ff8085`
                      * Set body to:
                    ```json
                    {
                      "roleName": "SECURITY_AUDITOR"
                    }
                    ```
                    * **List All Users (`GET /api/v1/users`):**
                      * Click **Execute** to see all users with pagination!
                    
                    ---
                    
                    ### 👥 Pre-Seeded Development Accounts
                    | Role | Email | Password | Privileges |
                    |:---|:---|:---|:---|
                    | **Super Admin** | `superadmin@authcore.io` | `AdminPassword123!` | Complete unrestricted platform access |
                    | **Standard User** | `john.doe@example.com` | `Password123!` | Standard application user |
                    
                    ---
                    
                    ### ⚠️ Common Error Codes
                    * **`401 Unauthorized`**: You haven't pasted your token in the green **Authorize 🔓** button yet, or token expired (tokens last 15 min).
                    * **`403 Forbidden`**: The action requires `SUPER_ADMIN` privileges (make sure you logged in as `superadmin@authcore.io`).
                    * **`429 Too Many Requests`**: Rate limit reached (>5 attempts/15 min). Wait a minute or test another endpoint.
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
