package com.authcore.user.dto;

import com.authcore.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
    @NotNull(message = "Status cannot be null")
    UserStatus status
) {}
