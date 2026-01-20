import {
    User, Role, Permission, Tool, Group, GroupMember,
    AccessRequest, AuditLog, PaginatedResponse, AuditLogFilter,
    CreateRoleRequest, CreateToolRequest, CreateGroupRequest,
    CreateAccessRequestDTO, DirectGrantRequest
} from './types';

const API_BASE_URL = 'http://localhost:8080';

function getAuthHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
}

// Auth
export async function login(email: string, password: string): Promise<{ token: string; roles: string[] }> {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
}

export async function logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    await handleResponse(response);
}

export async function checkSetupRequired(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/check-setup`, {
            credentials: 'include',
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.setup_required;
    } catch (error) {
        console.error('Failed to check setup status:', error);
        return false;
    }
}

export async function setupAdmin(email: string, password: string): Promise<{ token: string; roles: string[] }> {
    const response = await fetch(`${API_BASE_URL}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
}

// Roles
export async function listRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getRole(id: number): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function createRole(data: CreateRoleRequest): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateRole(id: number, data: Partial<CreateRoleRequest>): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function deleteRole(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
}

export async function getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ permission_ids: permissionIds }),
    });
    return handleResponse(response);
}

export async function getRoleHierarchy(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/api/roles/hierarchy`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

// Permissions
export async function listPermissions(category?: string): Promise<Permission[]> {
    const url = category ? `${API_BASE_URL}/api/permissions?category=${category}` : `${API_BASE_URL}/api/permissions`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getPermissionCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/permissions/categories`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

// Groups
export async function listGroups(): Promise<Group[]> {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getGroup(id: number): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function createGroup(data: CreateGroupRequest): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateGroup(id: number, data: Partial<CreateGroupRequest>): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function deleteGroup(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
}

export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function addGroupMembers(groupId: number, userIds: number[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_ids: userIds }),
    });
    return handleResponse(response);
}

export async function removeGroupMember(groupId: number, userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
}

export async function setGroupPermissions(groupId: number, permissionIds: number[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/permissions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ permission_ids: permissionIds }),
    });
    return handleResponse(response);
}

// Tools
export async function listTools(category?: string, activeOnly?: boolean): Promise<Tool[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (activeOnly) params.set('active_only', 'true');
    const url = `${API_BASE_URL}/api/tools${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getTool(id: number): Promise<Tool> {
    const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function createTool(data: CreateToolRequest): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/tools`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateTool(id: number, data: Partial<CreateToolRequest>): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function deleteTool(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
}

export async function getToolCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/tools/categories`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

// Access Requests
export async function createAccessRequest(data: CreateAccessRequestDTO): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/access/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function listAccessRequests(status?: string, userId?: number): Promise<AccessRequest[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (userId) params.set('user_id', userId.toString());
    const url = `${API_BASE_URL}/api/access/requests${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
    const response = await fetch(`${API_BASE_URL}/api/access/requests/pending`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getMyRequests(): Promise<AccessRequest[]> {
    const response = await fetch(`${API_BASE_URL}/api/access/my-requests`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function approveRequest(id: number, durationMinutes?: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/access/requests/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ duration_minutes: durationMinutes }),
    });
    return handleResponse(response);
}

export async function rejectRequest(id: number, reason: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/access/requests/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
}

export async function directGrant(data: DirectGrantRequest): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/access/grant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function revokeAccess(userId: number, targetType: string, targetId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/access/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, target_type: targetType, target_id: targetId }),
    });
    return handleResponse(response);
}

// Bulk Operations
export async function bulkAssignRoles(userIds: number[], roleIds: number[]): Promise<{ message: string; assignments: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bulk/users/roles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_ids: userIds, role_ids: roleIds }),
    });
    return handleResponse(response);
}

export async function bulkRemoveRoles(userIds: number[], roleIds: number[]): Promise<{ message: string; removals: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bulk/users/roles`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_ids: userIds, role_ids: roleIds }),
    });
    return handleResponse(response);
}

export async function bulkAddToGroups(userIds: number[], groupIds: number[]): Promise<{ message: string; memberships: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bulk/users/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_ids: userIds, group_ids: groupIds }),
    });
    return handleResponse(response);
}

export async function bulkGrantAccess(userIds: number[], toolIds: number[], accessLevel: string): Promise<{ message: string; grants: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bulk/access/grant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user_ids: userIds, tool_ids: toolIds, access_level: accessLevel }),
    });
    return handleResponse(response);
}

// Audit Logs
export async function listAuditLogs(filter: AuditLogFilter = {}): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.set(key, value.toString());
    });
    const url = `${API_BASE_URL}/api/audit/logs${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function getAuditCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/audit/categories`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    return handleResponse(response);
}

export async function exportAuditLogs(filter: AuditLogFilter = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.set(key, value.toString());
    });
    const url = `${API_BASE_URL}/api/audit/export${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
}
