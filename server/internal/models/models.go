package models

import "time"

// User represents a system user
type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FirstName    *string   `json:"first_name,omitempty"`
	LastName     *string   `json:"last_name,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Computed fields
	Roles       []Role   `json:"roles,omitempty"`
	Groups      []Group  `json:"groups,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
}

// Role represents a user role with hierarchy
type Role struct {
	ID                 int       `json:"id"`
	Name               string    `json:"name"`
	DisplayName        string    `json:"display_name"`
	Description        *string   `json:"description,omitempty"`
	HierarchyLevel     int       `json:"hierarchy_level"`
	CanGrantAccess     bool      `json:"can_grant_access"`
	CanApproveRequests bool      `json:"can_approve_requests"`
	IsSystemRole       bool      `json:"is_system_role"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Computed fields
	Permissions []Permission `json:"permissions,omitempty"`
	UserCount   int          `json:"user_count,omitempty"`
}

// Permission represents an action that can be performed
type Permission struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description *string   `json:"description,omitempty"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"created_at"`
}

// Tool represents a resource/tool that users can access
type Tool struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description *string   `json:"description,omitempty"`
	Category    *string   `json:"category,omitempty"`
	Icon        *string   `json:"icon,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Group represents a user group
type Group struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Computed fields
	MemberCount int          `json:"member_count,omitempty"`
	Permissions []Permission `json:"permissions,omitempty"`
}

// UserRole junction record
type UserRole struct {
	UserID    int       `json:"user_id"`
	RoleID    int       `json:"role_id"`
	GrantedBy *int      `json:"granted_by,omitempty"`
	GrantedAt time.Time `json:"granted_at"`

	// Computed fields
	RoleName      string `json:"role_name,omitempty"`
	GrantedByName string `json:"granted_by_name,omitempty"`
}

// GroupMember junction record
type GroupMember struct {
	UserID  int       `json:"user_id"`
	GroupID int       `json:"group_id"`
	AddedBy *int      `json:"added_by,omitempty"`
	AddedAt time.Time `json:"added_at"`

	// Computed fields
	UserEmail   string `json:"user_email,omitempty"`
	AddedByName string `json:"added_by_name,omitempty"`
}

// ToolAccess represents access to a tool
type ToolAccess struct {
	ToolID      int    `json:"tool_id"`
	AccessLevel string `json:"access_level"`
	ToolName    string `json:"tool_name,omitempty"`
}

// AccessRequest represents a request for access
type AccessRequest struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	RequestType     string     `json:"request_type"`
	TargetType      string     `json:"target_type"`
	TargetID        int        `json:"target_id"`
	AccessLevel     string     `json:"access_level"`
	Status          string     `json:"status"`
	Reason          *string    `json:"reason,omitempty"`
	DurationMinutes *int       `json:"duration_minutes,omitempty"`
	ApproverID      *int       `json:"approver_id,omitempty"`
	ApprovedBy      *int       `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectedBy      *int       `json:"rejected_by,omitempty"`
	RejectedAt      *time.Time `json:"rejected_at,omitempty"`
	RejectionReason *string    `json:"rejection_reason,omitempty"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`

	// Computed fields
	UserEmail      string `json:"user_email,omitempty"`
	TargetName     string `json:"target_name,omitempty"`
	ApproverName   string `json:"approver_name,omitempty"`
	ApprovedByName string `json:"approved_by_name,omitempty"`
	RejectedByName string `json:"rejected_by_name,omitempty"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID             int       `json:"id"`
	Action         string    `json:"action"`
	ActionCategory string    `json:"action_category"`
	ActorID        *int      `json:"actor_id,omitempty"`
	TargetType     *string   `json:"target_type,omitempty"`
	TargetID       *int      `json:"target_id,omitempty"`
	TargetName     *string   `json:"target_name,omitempty"`
	Details        *string   `json:"details,omitempty"`
	OldValue       *string   `json:"old_value,omitempty"`
	NewValue       *string   `json:"new_value,omitempty"`
	IPAddress      *string   `json:"ip_address,omitempty"`
	UserAgent      *string   `json:"user_agent,omitempty"`
	CreatedAt      time.Time `json:"created_at"`

	// Computed fields
	ActorEmail string `json:"actor_email,omitempty"`
}

// Resource represents a resource (kept for backward compatibility)
type Resource struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// Request/Response DTOs

type CreateRoleRequest struct {
	Name               string  `json:"name"`
	DisplayName        string  `json:"display_name"`
	Description        *string `json:"description,omitempty"`
	HierarchyLevel     int     `json:"hierarchy_level"`
	CanGrantAccess     bool    `json:"can_grant_access"`
	CanApproveRequests bool    `json:"can_approve_requests"`
}

type UpdateRoleRequest struct {
	DisplayName        *string `json:"display_name,omitempty"`
	Description        *string `json:"description,omitempty"`
	HierarchyLevel     *int    `json:"hierarchy_level,omitempty"`
	CanGrantAccess     *bool   `json:"can_grant_access,omitempty"`
	CanApproveRequests *bool   `json:"can_approve_requests,omitempty"`
}

type CreatePermissionRequest struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"display_name"`
	Description *string `json:"description,omitempty"`
	Category    string  `json:"category"`
}

type CreateToolRequest struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"display_name"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
	Icon        *string `json:"icon,omitempty"`
}

type UpdateToolRequest struct {
	DisplayName *string `json:"display_name,omitempty"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

type CreateGroupRequest struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"display_name"`
	Description *string `json:"description,omitempty"`
}

type UpdateGroupRequest struct {
	DisplayName *string `json:"display_name,omitempty"`
	Description *string `json:"description,omitempty"`
}

type AssignPermissionsRequest struct {
	PermissionIDs []int `json:"permission_ids"`
}

type AddMembersRequest struct {
	UserIDs []int `json:"user_ids"`
}

type BulkAssignRolesRequest struct {
	UserIDs []int `json:"user_ids"`
	RoleIDs []int `json:"role_ids"`
}

type BulkAddToGroupsRequest struct {
	UserIDs  []int `json:"user_ids"`
	GroupIDs []int `json:"group_ids"`
}

type BulkGrantAccessRequest struct {
	UserIDs     []int  `json:"user_ids"`
	ToolIDs     []int  `json:"tool_ids"`
	AccessLevel string `json:"access_level"`
}

type CreateAccessRequestDTO struct {
	TargetType      string  `json:"target_type"`
	TargetID        int     `json:"target_id"`
	AccessLevel     string  `json:"access_level"`
	Reason          *string `json:"reason,omitempty"`
	DurationMinutes *int    `json:"duration_minutes,omitempty"`
}

type ApproveAccessRequest struct {
	DurationMinutes *int `json:"duration_minutes,omitempty"`
}

type RejectAccessRequest struct {
	Reason string `json:"reason"`
}

type DirectGrantRequest struct {
	UserID          int    `json:"user_id"`
	TargetType      string `json:"target_type"`
	TargetID        int    `json:"target_id"`
	AccessLevel     string `json:"access_level"`
	DurationMinutes *int   `json:"duration_minutes,omitempty"`
}

type RevokeAccessRequest struct {
	UserID     int    `json:"user_id"`
	TargetType string `json:"target_type"`
	TargetID   int    `json:"target_id"`
}

type AuditLogFilter struct {
	ActorID        *int    `json:"actor_id,omitempty"`
	TargetID       *int    `json:"target_id,omitempty"`
	Action         *string `json:"action,omitempty"`
	ActionCategory *string `json:"action_category,omitempty"`
	TargetType     *string `json:"target_type,omitempty"`
	DateFrom       *string `json:"date_from,omitempty"`
	DateTo         *string `json:"date_to,omitempty"`
	Page           int     `json:"page"`
	Limit          int     `json:"limit"`
	SortBy         string  `json:"sort_by"`
	Order          string  `json:"order"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}
