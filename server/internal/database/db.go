package database

import (
	"database/sql"
	_ "embed"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed schema.sql
var schema string

var DB *sql.DB

func InitDB(dataSourceName string) error {
	var err error
	DB, err = sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Enable foreign keys
	if _, err := DB.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	if _, err := DB.Exec(schema); err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	// Seed default data
	if err := seedDefaultData(); err != nil {
		return fmt.Errorf("failed to seed default data: %w", err)
	}

	return nil
}

func seedDefaultData() error {
	// Seed default roles
	roles := []struct {
		name               string
		displayName        string
		description        string
		hierarchyLevel     int
		canGrantAccess     bool
		canApproveRequests bool
		isSystemRole       bool
	}{
		{"super_admin", "Super Admin", "Full system access with all privileges", 100, true, true, true},
		{"admin", "Administrator", "Administrative access to manage users and resources", 80, true, true, true},
		{"manager", "Manager", "Can approve access requests and view reports", 50, false, true, true},
		{"user", "User", "Standard user with basic access", 10, false, false, true},
	}

	for _, r := range roles {
		_, err := DB.Exec(`
			INSERT OR IGNORE INTO roles (name, display_name, description, hierarchy_level, can_grant_access, can_approve_requests, is_system_role)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			r.name, r.displayName, r.description, r.hierarchyLevel, r.canGrantAccess, r.canApproveRequests, r.isSystemRole)
		if err != nil {
			return fmt.Errorf("failed to seed role %s: %w", r.name, err)
		}
	}

	// Seed default permissions
	permissions := []struct {
		name        string
		displayName string
		description string
		category    string
	}{
		// User permissions
		{"users.create", "Create Users", "Create new user accounts", "users"},
		{"users.read", "View Users", "View user information", "users"},
		{"users.update", "Update Users", "Modify user accounts", "users"},
		{"users.delete", "Delete Users", "Remove user accounts", "users"},
		// Role permissions
		{"roles.create", "Create Roles", "Create new roles", "roles"},
		{"roles.read", "View Roles", "View role information", "roles"},
		{"roles.update", "Update Roles", "Modify roles", "roles"},
		{"roles.delete", "Delete Roles", "Remove roles", "roles"},
		{"roles.assign", "Assign Roles", "Assign roles to users", "roles"},
		// Group permissions
		{"groups.create", "Create Groups", "Create user groups", "groups"},
		{"groups.read", "View Groups", "View group information", "groups"},
		{"groups.update", "Update Groups", "Modify groups", "groups"},
		{"groups.delete", "Delete Groups", "Remove groups", "groups"},
		{"groups.manage_members", "Manage Group Members", "Add/remove group members", "groups"},
		// Tool permissions
		{"tools.create", "Create Tools", "Add new tools/resources", "tools"},
		{"tools.read", "View Tools", "View tools information", "tools"},
		{"tools.update", "Update Tools", "Modify tools", "tools"},
		{"tools.delete", "Delete Tools", "Remove tools", "tools"},
		{"tools.manage_access", "Manage Tool Access", "Manage access to tools", "tools"},
		// Access permissions
		{"access.request", "Request Access", "Request access to resources", "access"},
		{"access.approve", "Approve Access", "Approve access requests", "access"},
		{"access.reject", "Reject Access", "Reject access requests", "access"},
		{"access.grant", "Grant Access", "Directly grant access", "access"},
		{"access.revoke", "Revoke Access", "Revoke existing access", "access"},
		// Audit permissions
		{"audit.read", "View Audit Logs", "View audit logs", "audit"},
		{"audit.export", "Export Audit Logs", "Export audit log data", "audit"},
	}

	for _, p := range permissions {
		_, err := DB.Exec(`
			INSERT OR IGNORE INTO permissions (name, display_name, description, category)
			VALUES (?, ?, ?, ?)`,
			p.name, p.displayName, p.description, p.category)
		if err != nil {
			return fmt.Errorf("failed to seed permission %s: %w", p.name, err)
		}
	}

	// Assign all permissions to super_admin role
	_, err := DB.Exec(`
		INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin'`)
	if err != nil {
		return fmt.Errorf("failed to assign permissions to super_admin: %w", err)
	}

	// Assign most permissions to admin role (except role.delete and audit.export)
	_, err = DB.Exec(`
		INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id FROM roles r, permissions p 
		WHERE r.name = 'admin' AND p.name NOT IN ('roles.delete', 'audit.export')`)
	if err != nil {
		return fmt.Errorf("failed to assign permissions to admin: %w", err)
	}

	// Assign limited permissions to manager role
	_, err = DB.Exec(`
		INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id FROM roles r, permissions p 
		WHERE r.name = 'manager' AND p.name IN ('users.read', 'roles.read', 'groups.read', 'tools.read', 'access.approve', 'access.reject', 'audit.read')`)
	if err != nil {
		return fmt.Errorf("failed to assign permissions to manager: %w", err)
	}

	// Assign basic permissions to user role
	_, err = DB.Exec(`
		INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id FROM roles r, permissions p 
		WHERE r.name = 'user' AND p.name IN ('users.read', 'tools.read', 'access.request')`)
	if err != nil {
		return fmt.Errorf("failed to assign permissions to user: %w", err)
	}

	return nil
}
