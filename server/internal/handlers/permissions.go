package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"github.com/go-chi/chi/v5"
)

// ListPermissions returns all permissions
func ListPermissions(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")

	query := `
		SELECT id, name, display_name, description, category, created_at
		FROM permissions`
	args := []interface{}{}

	if category != "" {
		query += " WHERE category = ?"
		args = append(args, category)
	}
	query += " ORDER BY category, name"

	rows, err := database.DB.Query(query, args...)
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

// GetPermission returns a single permission by ID
func GetPermission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	permID, _ := strconv.Atoi(id)

	var perm models.Permission
	err := database.DB.QueryRow(`
		SELECT id, name, display_name, description, category, created_at
		FROM permissions WHERE id = ?`, permID).Scan(
		&perm.ID, &perm.Name, &perm.DisplayName, &perm.Description, &perm.Category, &perm.CreatedAt)
	if err != nil {
		http.Error(w, "Permission not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(perm)
}

// CreatePermission creates a new permission
func CreatePermission(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePermissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.DisplayName == "" || req.Category == "" {
		http.Error(w, "Name, display_name, and category are required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO permissions (name, display_name, description, category)
		VALUES (?, ?, ?, ?)`,
		req.Name, req.DisplayName, req.Description, req.Category)
	if err != nil {
		http.Error(w, "Failed to create permission", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	LogAudit(r, "permission.create", "permission", int(id), req.Name, nil, &req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Permission created successfully"})
}

// UpdatePermission updates an existing permission
func UpdatePermission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	permID, _ := strconv.Atoi(id)

	var req struct {
		DisplayName *string `json:"display_name,omitempty"`
		Description *string `json:"description,omitempty"`
		Category    *string `json:"category,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

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
	if req.Category != nil {
		updates = append(updates, "category = ?")
		args = append(args, *req.Category)
	}

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := "UPDATE permissions SET " + joinStrings(updates, ", ") + " WHERE id = ?"
	args = append(args, permID)

	_, err := database.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, "Failed to update permission", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "permission.update", "permission", permID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Permission updated successfully"})
}

// DeletePermission deletes a permission
func DeletePermission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	permID, _ := strconv.Atoi(id)

	var permName string
	database.DB.QueryRow("SELECT name FROM permissions WHERE id = ?", permID).Scan(&permName)

	_, err := database.DB.Exec("DELETE FROM permissions WHERE id = ?", permID)
	if err != nil {
		http.Error(w, "Failed to delete permission", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "permission.delete", "permission", permID, permName, nil, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Permission deleted successfully"})
}

// GetPermissionCategories returns all unique permission categories
func GetPermissionCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`SELECT DISTINCT category FROM permissions ORDER BY category`)
	if err != nil {
		http.Error(w, "Failed to fetch categories", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err != nil {
			http.Error(w, "Failed to scan category", http.StatusInternalServerError)
			return
		}
		categories = append(categories, cat)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}
