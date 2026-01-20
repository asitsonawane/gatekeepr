package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"github.com/go-chi/chi/v5"
)

// ListGroups returns all user groups
func ListGroups(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT g.id, g.name, g.display_name, g.description, g.created_at, g.updated_at,
			   (SELECT COUNT(*) FROM user_group_members WHERE group_id = g.id) as member_count
		FROM user_groups g
		ORDER BY g.name`)
	if err != nil {
		http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var group models.Group
		if err := rows.Scan(&group.ID, &group.Name, &group.DisplayName, &group.Description,
			&group.CreatedAt, &group.UpdatedAt, &group.MemberCount); err != nil {
			http.Error(w, "Failed to scan group", http.StatusInternalServerError)
			return
		}
		groups = append(groups, group)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

// GetGroup returns a single group by ID
func GetGroup(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

	var group models.Group
	err := database.DB.QueryRow(`
		SELECT id, name, display_name, description, created_at, updated_at
		FROM user_groups WHERE id = ?`, groupID).Scan(
		&group.ID, &group.Name, &group.DisplayName, &group.Description, &group.CreatedAt, &group.UpdatedAt)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Get permissions for this group
	permRows, err := database.DB.Query(`
		SELECT p.id, p.name, p.display_name, p.description, p.category, p.created_at
		FROM permissions p
		JOIN group_permissions gp ON p.id = gp.permission_id
		WHERE gp.group_id = ?`, groupID)
	if err == nil {
		defer permRows.Close()
		for permRows.Next() {
			var perm models.Permission
			if err := permRows.Scan(&perm.ID, &perm.Name, &perm.DisplayName, &perm.Description, &perm.Category, &perm.CreatedAt); err == nil {
				group.Permissions = append(group.Permissions, perm)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(group)
}

// CreateGroup creates a new user group
func CreateGroup(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.DisplayName == "" {
		http.Error(w, "Name and display_name are required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO user_groups (name, display_name, description)
		VALUES (?, ?, ?)`,
		req.Name, req.DisplayName, req.Description)
	if err != nil {
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	LogAudit(r, "group.create", "group", int(id), req.Name, nil, &req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Group created successfully"})
}

// UpdateGroup updates an existing group
func UpdateGroup(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

	var req models.UpdateGroupRequest
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

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := "UPDATE user_groups SET " + joinStrings(updates, ", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?"
	args = append(args, groupID)

	_, err := database.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, "Failed to update group", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "group.update", "group", groupID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Group updated successfully"})
}

// DeleteGroup deletes a user group
func DeleteGroup(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

	var groupName string
	database.DB.QueryRow("SELECT name FROM user_groups WHERE id = ?", groupID).Scan(&groupName)

	_, err := database.DB.Exec("DELETE FROM user_groups WHERE id = ?", groupID)
	if err != nil {
		http.Error(w, "Failed to delete group", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "group.delete", "group", groupID, groupName, nil, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Group deleted successfully"})
}

// GetGroupMembers returns members of a group
func GetGroupMembers(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

	rows, err := database.DB.Query(`
		SELECT u.id, u.email, u.first_name, u.last_name, ugm.added_at,
			   (SELECT email FROM users WHERE id = ugm.added_by) as added_by_email
		FROM users u
		JOIN user_group_members ugm ON u.id = ugm.user_id
		WHERE ugm.group_id = ?
		ORDER BY u.email`, groupID)
	if err != nil {
		http.Error(w, "Failed to fetch members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Member struct {
		ID           int     `json:"id"`
		Email        string  `json:"email"`
		FirstName    *string `json:"first_name,omitempty"`
		LastName     *string `json:"last_name,omitempty"`
		AddedAt      string  `json:"added_at"`
		AddedByEmail *string `json:"added_by_email,omitempty"`
	}

	var members []Member
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.ID, &m.Email, &m.FirstName, &m.LastName, &m.AddedAt, &m.AddedByEmail); err != nil {
			http.Error(w, "Failed to scan member", http.StatusInternalServerError)
			return
		}
		members = append(members, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

// AddGroupMembers adds members to a group (supports bulk)
func AddGroupMembers(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

	var req models.AddMembersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	actorID := GetActorID(r)

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	for _, userID := range req.UserIDs {
		_, err = tx.Exec(`
			INSERT OR IGNORE INTO user_group_members (user_id, group_id, added_by)
			VALUES (?, ?, ?)`, userID, groupID, actorID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to add member", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "group.members.add", "group", groupID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Members added successfully"})
}

// RemoveGroupMember removes a member from a group
func RemoveGroupMember(w http.ResponseWriter, r *http.Request) {
	groupID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := strconv.Atoi(chi.URLParam(r, "userId"))

	_, err := database.DB.Exec("DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?", groupID, userID)
	if err != nil {
		http.Error(w, "Failed to remove member", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "group.members.remove", "group", groupID, "", map[string]int{"user_id": userID}, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Member removed successfully"})
}

// SetGroupPermissions sets permissions for a group
func SetGroupPermissions(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	groupID, _ := strconv.Atoi(id)

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
	_, err = tx.Exec("DELETE FROM group_permissions WHERE group_id = ?", groupID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to clear permissions", http.StatusInternalServerError)
		return
	}

	// Add new permissions
	for _, permID := range req.PermissionIDs {
		_, err = tx.Exec("INSERT INTO group_permissions (group_id, permission_id) VALUES (?, ?)", groupID, permID)
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

	LogAudit(r, "group.permissions.update", "group", groupID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Permissions updated successfully"})
}
