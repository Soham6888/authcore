package com.authcore.common;

import com.authcore.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.regex.Pattern;

public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    private PasswordValidator() {
    }

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new ApiException("Password must be at least " + MIN_LENGTH + " characters long", HttpStatus.BAD_REQUEST);
        }
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one uppercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one lowercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one digit", HttpStatus.BAD_REQUEST);
        }
        if (!SPECIAL_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one special character", HttpStatus.BAD_REQUEST);
        }
    }
}
