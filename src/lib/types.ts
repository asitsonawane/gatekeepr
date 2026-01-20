// Core entities
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: Role[];
  groups?: Group[];
  permissions?: string[];
  avatar?: string;
  name?: string; // Computed from first_name + last_name or email
  role?: string; // Legacy compatibility
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  can_grant_access: boolean;
  can_approve_requests: boolean;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  user_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  created_at: string;
}

export interface Tool {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  environment?: string; // Legacy compatibility
}

export interface Group {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  permissions?: Permission[];
}

export interface GroupMember {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  added_at: string;
  added_by_email?: string;
}

export interface AccessRequest {
  id: number;
  user_id: number;
  request_type: string;
  target_type: string;
  target_id: number;
  access_level: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  reason?: string;
  duration_minutes?: number;
  approver_id?: number;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  expires_at?: string;
  created_at: string;
  user_email?: string;
  target_name?: string;
  approver_name?: string;
  approved_by_name?: string;
  rejected_by_name?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  action_category: string;
  actor_id?: number;
  target_type?: string;
  target_id?: number;
  target_name?: string;
  details?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  actor_email?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Legacy type aliases for backward compatibility
export interface PrivilegeLevel {
  id: string;
  toolId: string;
  name: string;
  description: string;
  permissions?: string[];
}

export interface Approver {
  id: string;
  type: 'user' | 'group';
  name: string;
  email?: string;
}

export interface ToolApprover {
  toolId: string;
  approverId: string;
}

export interface UserAccess {
  id: string;
  userId: string;
  toolId: string;
  privilegeLevelId: string;
  grantedAt: Date;
  grantedBy: string;
  status: 'active' | 'revoked';
}

// Request types
export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  can_grant_access: boolean;
  can_approve_requests: boolean;
}

export interface CreateToolRequest {
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  icon?: string;
}

export interface CreateGroupRequest {
  name: string;
  display_name: string;
  description?: string;
}

export interface CreateAccessRequestDTO {
  target_type: string;
  target_id: number;
  access_level: string;
  reason?: string;
  duration_minutes?: number;
}

export interface DirectGrantRequest {
  user_id: number;
  target_type: string;
  target_id: number;
  access_level: string;
  duration_minutes?: number;
}

export interface AuditLogFilter {
  actor_id?: number;
  action?: string;
  action_category?: string;
  target_type?: string;
  target_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}
