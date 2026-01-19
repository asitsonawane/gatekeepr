export interface Tool {
  id: string;
  name: string;
  environment: string;
  description: string;
  category: string;
}

export interface PrivilegeLevel {
  id: string;
  toolId: string;
  name: string;
  description: string;
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

export interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  toolId: string;
  toolName: string;
  toolEnvironment: string;
  privilegeLevelId: string;
  privilegeLevelName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewerName?: string;
  reviewerComment?: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'approver' | 'user';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}
