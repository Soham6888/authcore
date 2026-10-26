package com.authcore.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends ApiException {

    public AccountLockedException(String message) {
        super(message, HttpStatus.LOCKED);
    }
}
