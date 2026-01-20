package handlers

import (
	"encoding/json"
	"net/http"

	"gatekeepr/internal/auth"
	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string   `json:"token"`
	Roles []string `json:"roles"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user models.User
	err := database.DB.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ? AND is_active = 1", req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash)

	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Get user's roles from user_roles table
	roles := getUserRoles(user.ID)

	token, err := auth.GenerateToken(user.ID, user.Email, roles)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
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

	// Log the login
	LogAudit(r, "auth.login", "user", user.ID, user.Email, nil, nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{Token: token, Roles: roles})
}

func getUserRoles(userID int) []string {
	var roles []string
	rows, err := database.DB.Query(`
		SELECT r.name 
		FROM user_roles ur 
		JOIN roles r ON ur.role_id = r.id 
		WHERE ur.user_id = ?`, userID)
	if err != nil {
		return roles
	}
	defer rows.Close()

	for rows.Next() {
		var role string
		if rows.Scan(&role) == nil {
			roles = append(roles, role)
		}
	}
	return roles
}
