package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"github.com/go-chi/chi/v5"
)

// ListTools returns all tools
func ListTools(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	activeOnly := r.URL.Query().Get("active_only") == "true"

	query := `SELECT id, name, display_name, description, category, icon, is_active, created_at, updated_at FROM tools`
	where := []string{}
	args := []interface{}{}

	if category != "" {
		where = append(where, "category = ?")
		args = append(args, category)
	}
	if activeOnly {
		where = append(where, "is_active = 1")
	}

	if len(where) > 0 {
		query += " WHERE " + joinStrings(where, " AND ")
	}
	query += " ORDER BY category, name"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch tools", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tools []models.Tool
	for rows.Next() {
		var tool models.Tool
		if err := rows.Scan(&tool.ID, &tool.Name, &tool.DisplayName, &tool.Description,
			&tool.Category, &tool.Icon, &tool.IsActive, &tool.CreatedAt, &tool.UpdatedAt); err != nil {
			http.Error(w, "Failed to scan tool", http.StatusInternalServerError)
			return
		}
		tools = append(tools, tool)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tools)
}

// GetTool returns a single tool by ID
func GetTool(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	toolID, _ := strconv.Atoi(id)

	var tool models.Tool
	err := database.DB.QueryRow(`
		SELECT id, name, display_name, description, category, icon, is_active, created_at, updated_at
		FROM tools WHERE id = ?`, toolID).Scan(
		&tool.ID, &tool.Name, &tool.DisplayName, &tool.Description,
		&tool.Category, &tool.Icon, &tool.IsActive, &tool.CreatedAt, &tool.UpdatedAt)
	if err != nil {
		http.Error(w, "Tool not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tool)
}

// CreateTool creates a new tool
func CreateTool(w http.ResponseWriter, r *http.Request) {
	var req models.CreateToolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.DisplayName == "" {
		http.Error(w, "Name and display_name are required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO tools (name, display_name, description, category, icon)
		VALUES (?, ?, ?, ?, ?)`,
		req.Name, req.DisplayName, req.Description, req.Category, req.Icon)
	if err != nil {
		http.Error(w, "Failed to create tool", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	LogAudit(r, "tool.create", "tool", int(id), req.Name, nil, &req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Tool created successfully"})
}

// UpdateTool updates an existing tool
func UpdateTool(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	toolID, _ := strconv.Atoi(id)

	var req models.UpdateToolRequest
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
	if req.Icon != nil {
		updates = append(updates, "icon = ?")
		args = append(args, *req.Icon)
	}
	if req.IsActive != nil {
		updates = append(updates, "is_active = ?")
		args = append(args, *req.IsActive)
	}

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := "UPDATE tools SET " + joinStrings(updates, ", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?"
	args = append(args, toolID)

	_, err := database.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, "Failed to update tool", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "tool.update", "tool", toolID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Tool updated successfully"})
}

// DeleteTool deletes a tool
func DeleteTool(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	toolID, _ := strconv.Atoi(id)

	var toolName string
	database.DB.QueryRow("SELECT name FROM tools WHERE id = ?", toolID).Scan(&toolName)

	_, err := database.DB.Exec("DELETE FROM tools WHERE id = ?", toolID)
	if err != nil {
		http.Error(w, "Failed to delete tool", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "tool.delete", "tool", toolID, toolName, nil, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Tool deleted successfully"})
}

// GetToolCategories returns all unique tool categories
func GetToolCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`SELECT DISTINCT category FROM tools WHERE category IS NOT NULL ORDER BY category`)
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
