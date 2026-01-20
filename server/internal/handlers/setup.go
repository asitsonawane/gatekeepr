package handlers

import (
	"encoding/json"
	"net/http"

	"gatekeepr/internal/auth"
	"gatekeepr/internal/database"

	"golang.org/x/crypto/bcrypt"
)

type SetupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// CheckSetup returns true if the system is already configured (has at least one admin)
func CheckSetup(w http.ResponseWriter, r *http.Request) {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"setup_required": count == 0})
}

// Setup creates the initial Super Admin. Only works if 0 users exist.
func Setup(w http.ResponseWriter, r *http.Request) {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if count > 0 {
		http.Error(w, "System already initialized", http.StatusForbidden)
		return
	}

	var req SetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Start transaction for user creation and role assignment
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Create user without role column (new schema)
	res, err := tx.Exec("INSERT INTO users (email, password_hash, is_active) VALUES (?, ?, 1)", req.Email, string(hashedPassword))
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	userID, _ := res.LastInsertId()

	// Get super_admin role ID
	var superAdminRoleID int
	err = tx.QueryRow("SELECT id FROM roles WHERE name = 'super_admin'").Scan(&superAdminRoleID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to find super_admin role", http.StatusInternalServerError)
		return
	}

	// Assign super_admin role to the user
	_, err = tx.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", userID, superAdminRoleID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to assign role", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Auto-login after setup
	roles := []string{"super_admin"}
	token, err := auth.GenerateToken(int(userID), req.Email, roles)
	if err != nil {
		// User created but token failed
		http.Error(w, "User created but login failed", http.StatusOK)
		return
	}

	// Set JWT in HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		MaxAge:   86400, // 24 hours in seconds
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"roles": roles,
	})
}
