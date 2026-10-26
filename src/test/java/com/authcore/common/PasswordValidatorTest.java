package com.authcore.common;

import com.authcore.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordValidatorTest {

    @Test
    @DisplayName("Valid password meeting all complexity criteria passes validation")
    void validPassword_Passes() {
        assertDoesNotThrow(() -> PasswordValidator.validate("SecureP@ss123"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "Short1!",          // Less than 8 chars
        "alllowercase1!",   // No uppercase
        "ALLUPPERCASE1!",   // No lowercase
        "NoDigitsHere!",    // No digits
        "NoSpecialChar123", // No special char
        ""                  // Empty
    })
    @DisplayName("Weak passwords violating criteria are rejected")
    void weakPassword_ThrowsException(String weakPassword) {
        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(weakPassword));
        assertTrue(ex.getMessage().contains("Password must"));
    }
}
