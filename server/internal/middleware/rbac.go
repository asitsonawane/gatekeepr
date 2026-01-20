package middleware

import (
	"net/http"

	"gatekeepr/internal/auth"
	"gatekeepr/internal/database"
)

// RequireRole middleware checks if user has any of the specified roles
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*auth.Claims)
			if !ok || claims == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check if user has any of the required roles
			hasRole := false
			for _, role := range roles {
				var exists bool
				err := database.DB.QueryRow(`
					SELECT EXISTS(
						SELECT 1 FROM user_roles ur
						JOIN roles r ON ur.role_id = r.id
						WHERE ur.user_id = ? AND r.name = ?
					)`, claims.UserID, role).Scan(&exists)
				if err == nil && exists {
					hasRole = true
					break
				}
			}

			if !hasRole {
				http.Error(w, "Forbidden: insufficient role", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequirePermission middleware checks if user has a specific permission
func RequirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*auth.Claims)
			if !ok || claims == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			hasPermission := UserHasPermission(claims.UserID, permission)
			if !hasPermission {
				http.Error(w, "Forbidden: insufficient permission", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireHierarchy middleware checks if user has a role at or above the specified hierarchy level
func RequireHierarchy(minLevel int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*auth.Claims)
			if !ok || claims == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			var maxLevel int
			err := database.DB.QueryRow(`
				SELECT COALESCE(MAX(r.hierarchy_level), 0)
				FROM user_roles ur
				JOIN roles r ON ur.role_id = r.id
				WHERE ur.user_id = ?`, claims.UserID).Scan(&maxLevel)
			if err != nil || maxLevel < minLevel {
				http.Error(w, "Forbidden: insufficient hierarchy level", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// UserHasPermission checks if a user has a specific permission through roles or groups
func UserHasPermission(userID int, permission string) bool {
	// Check via roles
	var hasViaRole bool
	database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM user_roles ur
			JOIN role_permissions rp ON ur.role_id = rp.role_id
			JOIN permissions p ON rp.permission_id = p.id
			WHERE ur.user_id = ? AND p.name = ?
		)`, userID, permission).Scan(&hasViaRole)
	if hasViaRole {
		return true
	}

	// Check via groups
	var hasViaGroup bool
	database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM user_group_members ugm
			JOIN group_permissions gp ON ugm.group_id = gp.group_id
			JOIN permissions p ON gp.permission_id = p.id
			WHERE ugm.user_id = ? AND p.name = ?
		)`, userID, permission).Scan(&hasViaGroup)

	return hasViaGroup
}

// GetUserPermissions returns all permissions for a user
func GetUserPermissions(userID int) []string {
	var permissions []string

	// Get permissions from roles
	rows, err := database.DB.Query(`
		SELECT DISTINCT p.name
		FROM user_roles ur
		JOIN role_permissions rp ON ur.role_id = rp.role_id
		JOIN permissions p ON rp.permission_id = p.id
		WHERE ur.user_id = ?`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				permissions = append(permissions, name)
			}
		}
	}

	// Get permissions from groups
	rows, err = database.DB.Query(`
		SELECT DISTINCT p.name
		FROM user_group_members ugm
		JOIN group_permissions gp ON ugm.group_id = gp.group_id
		JOIN permissions p ON gp.permission_id = p.id
		WHERE ugm.user_id = ?`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				// Avoid duplicates
				found := false
				for _, p := range permissions {
					if p == name {
						found = true
						break
					}
				}
				if !found {
					permissions = append(permissions, name)
				}
			}
		}
	}

	return permissions
}

// GetUserRoles returns all role names for a user
func GetUserRoles(userID int) []string {
	var roles []string
	rows, err := database.DB.Query(`
		SELECT r.name
		FROM user_roles ur
		JOIN roles r ON ur.role_id = r.id
		WHERE ur.user_id = ?`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				roles = append(roles, name)
			}
		}
	}
	return roles
}

// GetUserMaxHierarchy returns the highest hierarchy level for a user
func GetUserMaxHierarchy(userID int) int {
	var maxLevel int
	database.DB.QueryRow(`
		SELECT COALESCE(MAX(r.hierarchy_level), 0)
		FROM user_roles ur
		JOIN roles r ON ur.role_id = r.id
		WHERE ur.user_id = ?`, userID).Scan(&maxLevel)
	return maxLevel
}
