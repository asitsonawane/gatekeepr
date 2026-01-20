package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gatekeepr/internal/auth"
	"gatekeepr/internal/database"
	authMiddleware "gatekeepr/internal/middleware"
	"gatekeepr/internal/models"
)

// ListAuditLogs returns audit logs with filters
func ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	// Parse pagination
	page, _ := strconv.Atoi(query.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// Build filter query
	baseQuery := `
		SELECT al.id, al.action, al.action_category, al.actor_id, 
			   al.target_type, al.target_id, al.target_name, al.details,
			   al.old_value, al.new_value, al.ip_address, al.user_agent, al.created_at,
			   COALESCE(u.email, 'System') as actor_email
		FROM audit_logs al
		LEFT JOIN users u ON al.actor_id = u.id
		WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM audit_logs al WHERE 1=1`

	args := []interface{}{}
	countArgs := []interface{}{}

	// Apply filters
	if actorID := query.Get("actor_id"); actorID != "" {
		baseQuery += " AND al.actor_id = ?"
		countQuery += " AND al.actor_id = ?"
		args = append(args, actorID)
		countArgs = append(countArgs, actorID)
	}
	if action := query.Get("action"); action != "" {
		baseQuery += " AND al.action LIKE ?"
		countQuery += " AND al.action LIKE ?"
		pattern := "%" + action + "%"
		args = append(args, pattern)
		countArgs = append(countArgs, pattern)
	}
	if actionCategory := query.Get("action_category"); actionCategory != "" {
		baseQuery += " AND al.action_category = ?"
		countQuery += " AND al.action_category = ?"
		args = append(args, actionCategory)
		countArgs = append(countArgs, actionCategory)
	}
	if targetType := query.Get("target_type"); targetType != "" {
		baseQuery += " AND al.target_type = ?"
		countQuery += " AND al.target_type = ?"
		args = append(args, targetType)
		countArgs = append(countArgs, targetType)
	}
	if targetID := query.Get("target_id"); targetID != "" {
		baseQuery += " AND al.target_id = ?"
		countQuery += " AND al.target_id = ?"
		args = append(args, targetID)
		countArgs = append(countArgs, targetID)
	}
	if dateFrom := query.Get("date_from"); dateFrom != "" {
		baseQuery += " AND DATE(al.created_at) >= ?"
		countQuery += " AND DATE(al.created_at) >= ?"
		args = append(args, dateFrom)
		countArgs = append(countArgs, dateFrom)
	}
	if dateTo := query.Get("date_to"); dateTo != "" {
		baseQuery += " AND DATE(al.created_at) <= ?"
		countQuery += " AND DATE(al.created_at) <= ?"
		args = append(args, dateTo)
		countArgs = append(countArgs, dateTo)
	}

	// Get total count
	var total int
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	// Apply sorting and pagination
	sortBy := query.Get("sort_by")
	if sortBy == "" {
		sortBy = "created_at"
	}
	order := query.Get("order")
	if order != "asc" {
		order = "desc"
	}
	baseQuery += " ORDER BY al." + sortBy + " " + order
	baseQuery += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := database.DB.Query(baseQuery, args...)
	if err != nil {
		http.Error(w, "Failed to fetch audit logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(&log.ID, &log.Action, &log.ActionCategory, &log.ActorID,
			&log.TargetType, &log.TargetID, &log.TargetName, &log.Details,
			&log.OldValue, &log.NewValue, &log.IPAddress, &log.UserAgent, &log.CreatedAt,
			&log.ActorEmail); err != nil {
			http.Error(w, "Failed to scan log", http.StatusInternalServerError)
			return
		}
		logs = append(logs, log)
	}

	totalPages := (total + limit - 1) / limit

	response := models.PaginatedResponse{
		Data:       logs,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetAuditLogCategories returns all unique action categories
func GetAuditLogCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`SELECT DISTINCT action_category FROM audit_logs WHERE action_category IS NOT NULL ORDER BY action_category`)
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

// ExportAuditLogs exports audit logs as JSON
func ExportAuditLogs(w http.ResponseWriter, r *http.Request) {
	// Re-use the list logic but without pagination
	query := r.URL.Query()

	baseQuery := `
		SELECT al.id, al.action, al.action_category, al.actor_id, 
			   al.target_type, al.target_id, al.target_name, al.details,
			   al.ip_address, al.user_agent, al.created_at,
			   COALESCE(u.email, 'System') as actor_email
		FROM audit_logs al
		LEFT JOIN users u ON al.actor_id = u.id
		WHERE 1=1`

	args := []interface{}{}

	if dateFrom := query.Get("date_from"); dateFrom != "" {
		baseQuery += " AND DATE(al.created_at) >= ?"
		args = append(args, dateFrom)
	}
	if dateTo := query.Get("date_to"); dateTo != "" {
		baseQuery += " AND DATE(al.created_at) <= ?"
		args = append(args, dateTo)
	}
	if actionCategory := query.Get("action_category"); actionCategory != "" {
		baseQuery += " AND al.action_category = ?"
		args = append(args, actionCategory)
	}

	baseQuery += " ORDER BY al.created_at DESC LIMIT 10000"

	rows, err := database.DB.Query(baseQuery, args...)
	if err != nil {
		http.Error(w, "Failed to fetch audit logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(&log.ID, &log.Action, &log.ActionCategory, &log.ActorID,
			&log.TargetType, &log.TargetID, &log.TargetName, &log.Details,
			&log.IPAddress, &log.UserAgent, &log.CreatedAt,
			&log.ActorEmail); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=audit_logs_export.json")
	json.NewEncoder(w).Encode(logs)
}

// LogAudit is a helper function to create audit log entries
func LogAudit(r *http.Request, action string, targetType string, targetID int, targetName string, oldValue interface{}, newValue interface{}) {
	actorID := GetActorID(r)

	var oldJSON, newJSON *string
	if oldValue != nil {
		if data, err := json.Marshal(oldValue); err == nil {
			s := string(data)
			oldJSON = &s
		}
	}
	if newValue != nil {
		if data, err := json.Marshal(newValue); err == nil {
			s := string(data)
			newJSON = &s
		}
	}

	// Extract action category from action (e.g., "role.create" -> "role")
	actionCategory := targetType
	for i, c := range action {
		if c == '.' {
			actionCategory = action[:i]
			break
		}
	}

	ipAddress := r.RemoteAddr
	userAgent := r.UserAgent()

	database.DB.Exec(`
		INSERT INTO audit_logs (action, action_category, actor_id, target_type, target_id, target_name, old_value, new_value, ip_address, user_agent)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		action, actionCategory, actorID, targetType, targetID, targetName, oldJSON, newJSON, ipAddress, userAgent)
}

// GetActorID extracts the current user ID from the request context
func GetActorID(r *http.Request) int {
	claims, ok := r.Context().Value(authMiddleware.UserContextKey).(*auth.Claims)
	if !ok || claims == nil {
		return 0
	}
	return claims.UserID
}

// CanGrantAccess checks if the current user can grant access directly
func CanGrantAccess(r *http.Request) bool {
	actorID := GetActorID(r)
	if actorID == 0 {
		return false
	}

	var canGrant bool
	database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM user_roles ur
			JOIN roles r ON ur.role_id = r.id
			WHERE ur.user_id = ? AND r.can_grant_access = 1
		)`, actorID).Scan(&canGrant)

	return canGrant
}

// CanApproveRequests checks if the current user can approve access requests
func CanApproveRequests(r *http.Request) bool {
	actorID := GetActorID(r)
	if actorID == 0 {
		return false
	}

	var canApprove bool
	database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM user_roles ur
			JOIN roles r ON ur.role_id = r.id
			WHERE ur.user_id = ? AND r.can_approve_requests = 1
		)`, actorID).Scan(&canApprove)

	return canApprove
}
