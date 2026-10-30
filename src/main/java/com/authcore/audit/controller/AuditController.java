package com.authcore.audit.controller;

import com.authcore.audit.AuditService;
import com.authcore.audit.dto.AuditLogResponse;
import com.authcore.common.ApiResponse;
import com.authcore.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "System-wide immutable audit log queries. Requires ADMIN or SUPER_ADMIN role.")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasAuthority('audit:read')")
    @Operation(summary = "Get system-wide audit logs", description = "Query all audit logs with optional filtering by userId and action.")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
        @RequestParam(required = false) UUID userId,
        @RequestParam(required = false) String action,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AuditLogResponse> response = auditService.getAuditLogs(userId, action, pageable);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", response));
    }
}
