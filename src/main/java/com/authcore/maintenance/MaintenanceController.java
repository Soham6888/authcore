package com.authcore.maintenance;

import com.authcore.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/maintenance")
@Tag(name = "System Maintenance", description = "Admin operations for GDPR data lifecycle, expired token pruning, and audit log archiving")
public class MaintenanceController {

    private final DataMaintenanceService maintenanceService;

    public MaintenanceController(DataMaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Trigger system maintenance job", description = "Executes GDPR data purging (30-day soft deletes), token cleanup, and audit archiving (90+ days).")
    public ResponseEntity<ApiResponse<DataMaintenanceService.MaintenanceSummary>> triggerMaintenance() {
        DataMaintenanceService.MaintenanceSummary summary = maintenanceService.executeAllMaintenance();
        return ResponseEntity.ok(ApiResponse.success("Maintenance cycle executed successfully", summary));
    }
}
