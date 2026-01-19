import { Tool, PrivilegeLevel, Approver, ToolApprover, AccessRequest, UserAccess, User, Group } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'user',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'approver',
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@company.com',
    role: 'admin',
  },
  {
    id: '4',
    name: 'Emma Williams',
    email: 'emma@company.com',
    role: 'approver',
  },
];

export const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Engineering',
    description: 'All engineering team members',
    memberIds: ['1', '2'],
  },
  {
    id: '2',
    name: 'DevOps',
    description: 'Infrastructure and operations team',
    memberIds: ['2'],
  },
  {
    id: '3',
    name: 'Finance',
    description: 'Finance and accounting team',
    memberIds: ['4'],
  },
];

export const mockTools: Tool[] = [
  {
    id: '1',
    name: 'GitHub',
    environment: 'Production',
    description: 'Source code repository and version control',
    category: 'Development',
  },
  {
    id: '2',
    name: 'GitHub',
    environment: 'Staging',
    description: 'Staging environment repository',
    category: 'Development',
  },
  {
    id: '3',
    name: 'AWS Console',
    environment: 'Production',
    description: 'Cloud infrastructure management',
    category: 'Infrastructure',
  },
  {
    id: '4',
    name: 'AWS Console',
    environment: 'Development',
    description: 'Development cloud environment',
    category: 'Infrastructure',
  },
  {
    id: '5',
    name: 'VPN',
    environment: 'Corporate',
    description: 'Corporate network access',
    category: 'Network',
  },
  {
    id: '6',
    name: 'Jira',
    environment: 'Production',
    description: 'Project management and issue tracking',
    category: 'Project Management',
  },
  {
    id: '7',
    name: 'Salesforce',
    environment: 'Production',
    description: 'Customer relationship management',
    category: 'Sales',
  },
  {
    id: '8',
    name: 'Salesforce',
    environment: 'Sandbox',
    description: 'Salesforce testing environment',
    category: 'Sales',
  },
];

export const mockPrivilegeLevels: PrivilegeLevel[] = [
  // GitHub - Production
  { id: '1', toolId: '1', name: 'Read Only', description: 'View repositories and code' },
  { id: '2', toolId: '1', name: 'Developer Access', description: 'Push code and create branches' },
  { id: '3', toolId: '1', name: 'Admin', description: 'Full repository administration' },
  
  // GitHub - Staging
  { id: '4', toolId: '2', name: 'Read Only', description: 'View repositories' },
  { id: '5', toolId: '2', name: 'Developer Access', description: 'Push and deploy to staging' },
  
  // AWS Console - Production
  { id: '6', toolId: '3', name: 'Read Only', description: 'View resources and logs' },
  { id: '7', toolId: '3', name: 'Developer', description: 'Manage development resources' },
  { id: '8', toolId: '3', name: 'Admin', description: 'Full infrastructure control' },
  
  // AWS Console - Development
  { id: '9', toolId: '4', name: 'Developer', description: 'Full development environment access' },
  
  // VPN - Corporate
  { id: '10', toolId: '5', name: 'Standard Access', description: 'Basic VPN connectivity' },
  { id: '11', toolId: '5', name: 'Full Access', description: 'Access to all network resources' },
  
  // Jira - Production
  { id: '12', toolId: '6', name: 'Viewer', description: 'View issues and boards' },
  { id: '13', toolId: '6', name: 'Contributor', description: 'Create and edit issues' },
  { id: '14', toolId: '6', name: 'Project Admin', description: 'Manage projects and workflows' },
  
  // Salesforce - Production
  { id: '15', toolId: '7', name: 'Read Only', description: 'View customer data' },
  { id: '16', toolId: '7', name: 'Sales User', description: 'Manage leads and opportunities' },
  { id: '17', toolId: '7', name: 'Billing Admin', description: 'Manage billing and invoices' },
  
  // Salesforce - Sandbox
  { id: '18', toolId: '8', name: 'Developer', description: 'Test and develop in sandbox' },
];

export const mockApprovers: Approver[] = [
  {
    id: '1',
    type: 'user',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
  },
  {
    id: '2',
    type: 'user',
    name: 'Michael Chen',
    email: 'michael@company.com',
  },
  {
    id: '3',
    type: 'user',
    name: 'Emma Williams',
    email: 'emma@company.com',
  },
  {
    id: '4',
    type: 'group',
    name: 'DevOps',
  },
  {
    id: '5',
    type: 'group',
    name: 'Engineering',
  },
];

export const mockToolApprovers: ToolApprover[] = [
  { toolId: '1', approverId: '1' }, // GitHub Production - Sarah
  { toolId: '1', approverId: '4' }, // GitHub Production - DevOps Group
  { toolId: '2', approverId: '1' }, // GitHub Staging - Sarah
  { toolId: '3', approverId: '2' }, // AWS Production - Michael
  { toolId: '3', approverId: '4' }, // AWS Production - DevOps Group
  { toolId: '4', approverId: '4' }, // AWS Dev - DevOps Group
  { toolId: '5', approverId: '2' }, // VPN - Michael
  { toolId: '6', approverId: '1' }, // Jira - Sarah
  { toolId: '7', approverId: '3' }, // Salesforce Prod - Emma
  { toolId: '8', approverId: '3' }, // Salesforce Sandbox - Emma
];

export const mockAccessRequests: AccessRequest[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    userEmail: 'john@company.com',
    toolId: '1',
    toolName: 'GitHub',
    toolEnvironment: 'Production',
    privilegeLevelId: '2',
    privilegeLevelName: 'Developer Access',
    reason: 'Need to contribute to the frontend repository for the new dashboard project',
    status: 'pending',
    requestedAt: new Date('2024-11-06T10:30:00'),
  },
  {
    id: '2',
    userId: '1',
    userName: 'John Doe',
    userEmail: 'john@company.com',
    toolId: '3',
    toolName: 'AWS Console',
    toolEnvironment: 'Production',
    privilegeLevelId: '6',
    privilegeLevelName: 'Read Only',
    reason: 'Need to view production logs for debugging',
    status: 'approved',
    requestedAt: new Date('2024-11-04T14:20:00'),
    reviewedAt: new Date('2024-11-05T09:15:00'),
    reviewedBy: '2',
    reviewerName: 'Michael Chen',
    reviewerComment: 'Approved for debugging purposes. Access expires in 30 days.',
  },
  {
    id: '3',
    userId: '4',
    userName: 'Emma Williams',
    userEmail: 'emma@company.com',
    toolId: '1',
    toolName: 'GitHub',
    toolEnvironment: 'Production',
    privilegeLevelId: '3',
    privilegeLevelName: 'Admin',
    reason: 'Need admin access to configure repository settings and webhooks',
    status: 'pending',
    requestedAt: new Date('2024-11-06T08:45:00'),
  },
];

export const mockUserAccess: UserAccess[] = [
  {
    id: '1',
    userId: '1',
    toolId: '2',
    privilegeLevelId: '5',
    grantedAt: new Date('2024-10-15T10:00:00'),
    grantedBy: 'Sarah Johnson',
    status: 'active',
  },
  {
    id: '2',
    userId: '1',
    toolId: '6',
    privilegeLevelId: '13',
    grantedAt: new Date('2024-10-10T14:30:00'),
    grantedBy: 'Sarah Johnson',
    status: 'active',
  },
  {
    id: '3',
    userId: '1',
    toolId: '5',
    privilegeLevelId: '10',
    grantedAt: new Date('2024-09-20T09:00:00'),
    grantedBy: 'Michael Chen',
    status: 'active',
  },
  {
    id: '4',
    userId: '1',
    toolId: '3',
    privilegeLevelId: '6',
    grantedAt: new Date('2024-11-05T09:15:00'),
    grantedBy: 'Michael Chen',
    status: 'active',
  },
];
