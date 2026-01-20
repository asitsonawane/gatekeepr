package handlers

import (
	"encoding/json"
	"net/http"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"
)

// BulkAssignRoles assigns roles to multiple users
func BulkAssignRoles(w http.ResponseWriter, r *http.Request) {
	var req models.BulkAssignRolesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.UserIDs) == 0 || len(req.RoleIDs) == 0 {
		http.Error(w, "user_ids and role_ids are required", http.StatusBadRequest)
		return
	}

	actorID := GetActorID(r)

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	count := 0
	for _, userID := range req.UserIDs {
		for _, roleID := range req.RoleIDs {
			result, err := tx.Exec(`
				INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
				VALUES (?, ?, ?)`, userID, roleID, actorID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to assign role", http.StatusInternalServerError)
				return
			}
			affected, _ := result.RowsAffected()
			count += int(affected)
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "bulk.roles.assign", "user", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Roles assigned successfully",
		"assignments":    count,
		"users_affected": len(req.UserIDs),
	})
}

// BulkAddToGroups adds multiple users to multiple groups
func BulkAddToGroups(w http.ResponseWriter, r *http.Request) {
	var req models.BulkAddToGroupsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.UserIDs) == 0 || len(req.GroupIDs) == 0 {
		http.Error(w, "user_ids and group_ids are required", http.StatusBadRequest)
		return
	}

	actorID := GetActorID(r)

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	count := 0
	for _, userID := range req.UserIDs {
		for _, groupID := range req.GroupIDs {
			result, err := tx.Exec(`
				INSERT OR IGNORE INTO user_group_members (user_id, group_id, added_by)
				VALUES (?, ?, ?)`, userID, groupID, actorID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to add to group", http.StatusInternalServerError)
				return
			}
			affected, _ := result.RowsAffected()
			count += int(affected)
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "bulk.groups.add", "user", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Users added to groups successfully",
		"memberships":    count,
		"users_affected": len(req.UserIDs),
	})
}

// BulkAssignPermissions assigns permissions to multiple groups
func BulkAssignPermissions(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GroupIDs      []int `json:"group_ids"`
		PermissionIDs []int `json:"permission_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.GroupIDs) == 0 || len(req.PermissionIDs) == 0 {
		http.Error(w, "group_ids and permission_ids are required", http.StatusBadRequest)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	count := 0
	for _, groupID := range req.GroupIDs {
		for _, permID := range req.PermissionIDs {
			result, err := tx.Exec(`
				INSERT OR IGNORE INTO group_permissions (group_id, permission_id)
				VALUES (?, ?)`, groupID, permID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to assign permission", http.StatusInternalServerError)
				return
			}
			affected, _ := result.RowsAffected()
			count += int(affected)
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "bulk.permissions.assign", "group", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":         "Permissions assigned successfully",
		"assignments":     count,
		"groups_affected": len(req.GroupIDs),
	})
}

// BulkGrantAccess grants tool access to multiple users
func BulkGrantAccess(w http.ResponseWriter, r *http.Request) {
	var req models.BulkGrantAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.UserIDs) == 0 || len(req.ToolIDs) == 0 {
		http.Error(w, "user_ids and tool_ids are required", http.StatusBadRequest)
		return
	}

	if req.AccessLevel == "" {
		req.AccessLevel = "read"
	}

	// Check if actor has grant permission
	if !CanGrantAccess(r) {
		http.Error(w, "You do not have permission to grant access", http.StatusForbidden)
		return
	}

	actorID := GetActorID(r)

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// For bulk grant, we create approved access requests
	count := 0
	for _, userID := range req.UserIDs {
		for _, toolID := range req.ToolIDs {
			result, err := tx.Exec(`
				INSERT INTO access_requests (user_id, request_type, target_type, target_id, access_level, status, approved_by, approved_at)
				VALUES (?, 'tool_access', 'tool', ?, ?, 'APPROVED', ?, CURRENT_TIMESTAMP)`,
				userID, toolID, req.AccessLevel, actorID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to grant access", http.StatusInternalServerError)
				return
			}
			affected, _ := result.RowsAffected()
			count += int(affected)
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "bulk.access.grant", "access", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Access granted successfully",
		"grants":         count,
		"users_affected": len(req.UserIDs),
	})
}

// BulkRemoveRoles removes roles from multiple users
func BulkRemoveRoles(w http.ResponseWriter, r *http.Request) {
	var req models.BulkAssignRolesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.UserIDs) == 0 || len(req.RoleIDs) == 0 {
		http.Error(w, "user_ids and role_ids are required", http.StatusBadRequest)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	count := 0
	for _, userID := range req.UserIDs {
		for _, roleID := range req.RoleIDs {
			result, err := tx.Exec(`DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`, userID, roleID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to remove role", http.StatusInternalServerError)
				return
			}
			affected, _ := result.RowsAffected()
			count += int(affected)
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "bulk.roles.remove", "user", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Roles removed successfully",
		"removals": count,
	})
}
