package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"gatekeepr/internal/database"
	"gatekeepr/internal/models"

	"github.com/go-chi/chi/v5"
)

// CreateAccessRequest creates a new access request
func CreateAccessRequest(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAccessRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TargetType == "" || req.TargetID == 0 {
		http.Error(w, "target_type and target_id are required", http.StatusBadRequest)
		return
	}

	if req.AccessLevel == "" {
		req.AccessLevel = "read"
	}

	userID := GetActorID(r)

	// Check if user already has a pending request for this target
	var existingCount int
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM access_requests 
		WHERE user_id = ? AND target_type = ? AND target_id = ? AND status = 'PENDING'`,
		userID, req.TargetType, req.TargetID).Scan(&existingCount)

	if existingCount > 0 {
		http.Error(w, "You already have a pending request for this resource", http.StatusConflict)
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO access_requests (user_id, request_type, target_type, target_id, access_level, reason, duration_minutes)
		VALUES (?, 'tool_access', ?, ?, ?, ?, ?)`,
		userID, req.TargetType, req.TargetID, req.AccessLevel, req.Reason, req.DurationMinutes)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	LogAudit(r, "access.request.create", "access_request", int(id), "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Access request created successfully"})
}

// ListAccessRequests returns access requests with filters
func ListAccessRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	userID := r.URL.Query().Get("user_id")
	targetType := r.URL.Query().Get("target_type")

	query := `
		SELECT ar.id, ar.user_id, ar.request_type, ar.target_type, ar.target_id, 
			   ar.access_level, ar.status, ar.reason, ar.duration_minutes,
			   ar.approver_id, ar.approved_by, ar.approved_at, 
			   ar.rejected_by, ar.rejected_at, ar.rejection_reason,
			   ar.expires_at, ar.created_at,
			   u.email as user_email
		FROM access_requests ar
		JOIN users u ON ar.user_id = u.id
		WHERE 1=1`
	args := []interface{}{}

	if status != "" {
		query += " AND ar.status = ?"
		args = append(args, status)
	}
	if userID != "" {
		query += " AND ar.user_id = ?"
		args = append(args, userID)
	}
	if targetType != "" {
		query += " AND ar.target_type = ?"
		args = append(args, targetType)
	}

	query += " ORDER BY ar.created_at DESC LIMIT 100"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []models.AccessRequest
	for rows.Next() {
		var req models.AccessRequest
		if err := rows.Scan(&req.ID, &req.UserID, &req.RequestType, &req.TargetType, &req.TargetID,
			&req.AccessLevel, &req.Status, &req.Reason, &req.DurationMinutes,
			&req.ApproverID, &req.ApprovedBy, &req.ApprovedAt,
			&req.RejectedBy, &req.RejectedAt, &req.RejectionReason,
			&req.ExpiresAt, &req.CreatedAt, &req.UserEmail); err != nil {
			http.Error(w, "Failed to scan request", http.StatusInternalServerError)
			return
		}
		requests = append(requests, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// GetPendingRequests returns requests pending approval
func GetPendingRequests(w http.ResponseWriter, r *http.Request) {
	// Only show pending requests to users who can approve
	if !CanApproveRequests(r) {
		http.Error(w, "You do not have permission to view pending requests", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(`
		SELECT ar.id, ar.user_id, ar.request_type, ar.target_type, ar.target_id, 
			   ar.access_level, ar.status, ar.reason, ar.duration_minutes,
			   ar.created_at, u.email as user_email
		FROM access_requests ar
		JOIN users u ON ar.user_id = u.id
		WHERE ar.status = 'PENDING'
		ORDER BY ar.created_at ASC`)
	if err != nil {
		http.Error(w, "Failed to fetch requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type PendingRequest struct {
		ID              int       `json:"id"`
		UserID          int       `json:"user_id"`
		RequestType     string    `json:"request_type"`
		TargetType      string    `json:"target_type"`
		TargetID        int       `json:"target_id"`
		AccessLevel     string    `json:"access_level"`
		Status          string    `json:"status"`
		Reason          *string   `json:"reason,omitempty"`
		DurationMinutes *int      `json:"duration_minutes,omitempty"`
		CreatedAt       time.Time `json:"created_at"`
		UserEmail       string    `json:"user_email"`
	}

	var requests []PendingRequest
	for rows.Next() {
		var req PendingRequest
		if err := rows.Scan(&req.ID, &req.UserID, &req.RequestType, &req.TargetType, &req.TargetID,
			&req.AccessLevel, &req.Status, &req.Reason, &req.DurationMinutes,
			&req.CreatedAt, &req.UserEmail); err != nil {
			http.Error(w, "Failed to scan request", http.StatusInternalServerError)
			return
		}
		requests = append(requests, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// ApproveAccessRequest approves a pending request
func ApproveAccessRequest(w http.ResponseWriter, r *http.Request) {
	if !CanApproveRequests(r) {
		http.Error(w, "You do not have permission to approve requests", http.StatusForbidden)
		return
	}

	requestID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req models.ApproveAccessRequest
	json.NewDecoder(r.Body).Decode(&req)

	approverID := GetActorID(r)

	// Calculate expiration
	var expiresAt *time.Time
	if req.DurationMinutes != nil && *req.DurationMinutes > 0 {
		t := time.Now().Add(time.Duration(*req.DurationMinutes) * time.Minute)
		expiresAt = &t
	}

	_, err := database.DB.Exec(`
		UPDATE access_requests 
		SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, expires_at = ?
		WHERE id = ? AND status = 'PENDING'`,
		approverID, expiresAt, requestID)
	if err != nil {
		http.Error(w, "Failed to approve request", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "access.request.approve", "access_request", requestID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Request approved successfully"})
}

// RejectAccessRequest rejects a pending request
func RejectAccessRequest(w http.ResponseWriter, r *http.Request) {
	if !CanApproveRequests(r) {
		http.Error(w, "You do not have permission to reject requests", http.StatusForbidden)
		return
	}

	requestID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req models.RejectAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	rejectorID := GetActorID(r)

	_, err := database.DB.Exec(`
		UPDATE access_requests 
		SET status = 'REJECTED', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, rejection_reason = ?
		WHERE id = ? AND status = 'PENDING'`,
		rejectorID, req.Reason, requestID)
	if err != nil {
		http.Error(w, "Failed to reject request", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "access.request.reject", "access_request", requestID, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Request rejected successfully"})
}

// DirectGrant grants access directly without a request (for authorized users)
func DirectGrant(w http.ResponseWriter, r *http.Request) {
	if !CanGrantAccess(r) {
		http.Error(w, "You do not have permission to grant access directly", http.StatusForbidden)
		return
	}

	var req models.DirectGrantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == 0 || req.TargetType == "" || req.TargetID == 0 {
		http.Error(w, "user_id, target_type, and target_id are required", http.StatusBadRequest)
		return
	}

	if req.AccessLevel == "" {
		req.AccessLevel = "read"
	}

	granterID := GetActorID(r)

	var expiresAt *time.Time
	if req.DurationMinutes != nil && *req.DurationMinutes > 0 {
		t := time.Now().Add(time.Duration(*req.DurationMinutes) * time.Minute)
		expiresAt = &t
	}

	result, err := database.DB.Exec(`
		INSERT INTO access_requests (user_id, request_type, target_type, target_id, access_level, status, approved_by, approved_at, expires_at)
		VALUES (?, 'tool_access', ?, ?, ?, 'APPROVED', ?, CURRENT_TIMESTAMP, ?)`,
		req.UserID, req.TargetType, req.TargetID, req.AccessLevel, granterID, expiresAt)
	if err != nil {
		http.Error(w, "Failed to grant access", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	LogAudit(r, "access.grant.direct", "access_request", int(id), "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Access granted successfully"})
}

// RevokeAccess revokes existing access
func RevokeAccess(w http.ResponseWriter, r *http.Request) {
	if !CanGrantAccess(r) {
		http.Error(w, "You do not have permission to revoke access", http.StatusForbidden)
		return
	}

	var req models.RevokeAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec(`
		UPDATE access_requests 
		SET status = 'REVOKED'
		WHERE user_id = ? AND target_type = ? AND target_id = ? AND status = 'APPROVED'`,
		req.UserID, req.TargetType, req.TargetID)
	if err != nil {
		http.Error(w, "Failed to revoke access", http.StatusInternalServerError)
		return
	}

	LogAudit(r, "access.revoke", "access_request", 0, "", nil, &req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Access revoked successfully"})
}

// GetMyRequests returns current user's access requests
func GetMyRequests(w http.ResponseWriter, r *http.Request) {
	userID := GetActorID(r)

	rows, err := database.DB.Query(`
		SELECT id, request_type, target_type, target_id, access_level, 
			   status, reason, duration_minutes, approved_at, 
			   rejected_at, rejection_reason, expires_at, created_at
		FROM access_requests
		WHERE user_id = ?
		ORDER BY created_at DESC`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []models.AccessRequest
	for rows.Next() {
		var req models.AccessRequest
		req.UserID = userID
		if err := rows.Scan(&req.ID, &req.RequestType, &req.TargetType, &req.TargetID,
			&req.AccessLevel, &req.Status, &req.Reason, &req.DurationMinutes,
			&req.ApprovedAt, &req.RejectedAt, &req.RejectionReason,
			&req.ExpiresAt, &req.CreatedAt); err != nil {
			http.Error(w, "Failed to scan request", http.StatusInternalServerError)
			return
		}
		requests = append(requests, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}
