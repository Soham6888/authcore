package com.authcore.exception;

import org.springframework.http.HttpStatus;

public class AccountSuspendedException extends ApiException {
    public AccountSuspendedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
