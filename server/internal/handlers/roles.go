package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"github.com/go-chi/chi/v5"
)

// ListRoles returns all roles
func ListRoles(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT r.id, r.name, r.display_name, r.description, r.hierarchy_level, 
			   r.can_grant_access, r.can_approve_requests, r.is_system_role, 
			   r.created_at, r.updated_at,
			   (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count
		FROM roles r
		ORDER BY r.hierarchy_level DESC`)
	if err != nil {
		http.Error(w, "Failed to fetch roles", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description,
			&role.HierarchyLevel, &role.CanGrantAccess, &role.CanApproveRequests,
			&role.IsSystemRole, &role.CreatedAt, &role.UpdatedAt, &role.UserCount); err != nil {
			http.Error(w, "Failed to scan role", http.StatusInternalServerError)
			return
		}
		roles = append(roles, role)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}

// GetRole returns a single role by ID
func GetRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	roleID, _ := strconv.Atoi(id)

	var role models.Role
	err := database.DB.QueryRow(`
		SELECT id, name, display_name, description, hierarchy_level, 
			   can_grant_access, can_approve_requests, is_system_role, 
			   created_at, updated_at
		FROM roles WHERE id = ?`, roleID).Scan(
		&role.ID, &role.Name, &role.DisplayName, &role.Description,
		&role.HierarchyLevel, &role.CanGrantAccess, &role.CanApproveRequests,
		&role.IsSystemRole, &role.CreatedAt, &role.UpdatedAt)
	if err != nil {
		http.Error(w, "Role not found", http.StatusNotFound)
		return
	}

	// Get permissions for this role
	permRows, err := database.DB.Query(`
		SELECT p.id, p.name, p.display_name, p.description, p.category, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = ?`, roleID)
	if err == nil {
		defer permRows.Close()
		for permRows.Next() {
			var perm models.Permission
			if err := permRows.Scan(&perm.ID, &perm.Name, &perm.DisplayName, &perm.Description, &perm.Category, &perm.CreatedAt); err == nil {
				role.Permissions = append(role.Permissions, perm)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(role)
}

// CreateRole creates a new role
func CreateRole(w http.ResponseWriter, r *http.Request) {
	var req models.CreateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.DisplayName == "" {
		http.Error(w, "Name and display_name are required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO roles (name, display_name, description, hierarchy_level, can_grant_access, can_approve_requests)
		VALUES (?, ?, ?, ?, ?, ?)`,
		req.Name, req.DisplayName, req.Description, req.HierarchyLevel, req.CanGrantAccess, req.CanApproveRequests)
	if err != nil {
		http.Error(w, "Failed to create role", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	// Log the action
	LogAudit(r, "role.create", "role", int(id), req.Name, nil, &req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Role created successfully"})
}

// UpdateRole updates an existing role
func UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	roleID, _ := strconv.Atoi(id)

	// Check if it's a system role
	var isSystemRole bool
	database.DB.QueryRow("SELECT is_system_role FROM roles WHERE id = ?", roleID).Scan(&isSystemRole)
	if isSystemRole {
		http.Error(w, "Cannot modify system roles", http.StatusForbidden)
		return
	}

	var req models.UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}

	if req.DisplayName != nil {
		updates = append(updates, "display_name = ?")
		args = append(args, *req.DisplayName)
	}
	if req.Description != nil {
		updates = append(updates, "description = ?")
		args = append(args, *req.Description)
	}
	if req.HierarchyLevel != nil {
		updates = append(updates, "hierarchy_level = ?")
		args = append(args, *req.HierarchyLevel)
	}
	if req.CanGrantAccess != nil {
		updates = append(updates, "can_grant_access = ?")
		args = append(args, *req.CanGrantAccess)
	}
	if req.CanApproveRequests != nil {
		updates = append(updates, "can_approve_requests = ?")
		args = append(args, *req.CanApproveRequests)
	}

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := "UPDATE roles SET " + joinStrings(updates, ", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?"
	args = append(args, roleID)

	_, err := database.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "role.update", "role", roleID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Role updated successfully"})
}

// DeleteRole deletes a role
func DeleteRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	roleID, _ := strconv.Atoi(id)

	// Check if it's a system role
	var isSystemRole bool
	var roleName string
	database.DB.QueryRow("SELECT is_system_role, name FROM roles WHERE id = ?", roleID).Scan(&isSystemRole, &roleName)
	if isSystemRole {
		http.Error(w, "Cannot delete system roles", http.StatusForbidden)
		return
	}

	_, err := database.DB.Exec("DELETE FROM roles WHERE id = ?", roleID)
	if err != nil {
		http.Error(w, "Failed to delete role", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "role.delete", "role", roleID, roleName, nil, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Role deleted successfully"})
}

// GetRolePermissions returns permissions for a role
func GetRolePermissions(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	roleID, _ := strconv.Atoi(id)

	rows, err := database.DB.Query(`
		SELECT p.id, p.name, p.display_name, p.description, p.category, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = ?
		ORDER BY p.category, p.name`, roleID)
	if err != nil {
		http.Error(w, "Failed to fetch permissions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		if err := rows.Scan(&perm.ID, &perm.Name, &perm.DisplayName, &perm.Description, &perm.Category, &perm.CreatedAt); err != nil {
			http.Error(w, "Failed to scan permission", http.StatusInternalServerError)
			return
		}
		permissions = append(permissions, perm)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(permissions)
}

// SetRolePermissions sets permissions for a role
func SetRolePermissions(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	roleID, _ := strconv.Atoi(id)

	var req models.AssignPermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Remove existing permissions
	_, err = tx.Exec("DELETE FROM role_permissions WHERE role_id = ?", roleID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to clear permissions", http.StatusInternalServerError)
		return
	}

	// Add new permissions
	for _, permID := range req.PermissionIDs {
		_, err = tx.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", roleID, permID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to assign permission", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "role.permissions.update", "role", roleID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Permissions updated successfully"})
}

// GetRoleHierarchy returns the role hierarchy tree
func GetRoleHierarchy(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, name, display_name, hierarchy_level, can_grant_access, can_approve_requests
		FROM roles
		ORDER BY hierarchy_level DESC`)
	if err != nil {
		http.Error(w, "Failed to fetch hierarchy", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type HierarchyNode struct {
		ID                 int    `json:"id"`
		Name               string `json:"name"`
		DisplayName        string `json:"display_name"`
		HierarchyLevel     int    `json:"hierarchy_level"`
		CanGrantAccess     bool   `json:"can_grant_access"`
		CanApproveRequests bool   `json:"can_approve_requests"`
	}

	var nodes []HierarchyNode
	for rows.Next() {
		var node HierarchyNode
		if err := rows.Scan(&node.ID, &node.Name, &node.DisplayName, &node.HierarchyLevel, &node.CanGrantAccess, &node.CanApproveRequests); err != nil {
			http.Error(w, "Failed to scan node", http.StatusInternalServerError)
			return
		}
		nodes = append(nodes, node)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

// Helper function to join strings
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
