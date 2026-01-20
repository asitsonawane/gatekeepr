import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Plus, Edit2, Trash2, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Role, Permission } from '../../lib/types';
import * as api from '../../lib/api';

export function RolesManagement() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [expandedRole, setExpandedRole] = useState<number | null>(null);
    const [newRole, setNewRole] = useState({
        name: '',
        display_name: '',
        description: '',
        hierarchy_level: 10,
        can_grant_access: false,
        can_approve_requests: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rolesData, permsData] = await Promise.all([
                api.listRoles(),
                api.listPermissions(),
            ]);
            setRoles(rolesData || []);
            setPermissions(permsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRole = async () => {
        try {
            await api.createRole(newRole);
            setShowAddDialog(false);
            setNewRole({
                name: '',
                display_name: '',
                description: '',
                hierarchy_level: 10,
                can_grant_access: false,
                can_approve_requests: false,
            });
            loadData();
        } catch (error) {
            console.error('Failed to create role:', error);
        }
    };

    const handleDeleteRole = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            await api.deleteRole(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete role:', error);
            alert('Cannot delete system roles');
        }
    };

    const getHierarchyColor = (level: number) => {
        if (level >= 80) return 'bg-red-500';
        if (level >= 50) return 'bg-orange-500';
        if (level >= 30) return 'bg-blue-500';
        return 'bg-slate-500';
    };

    if (loading) {
        return <div className="p-8 text-center">Loading roles...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Role Management</h3>
                    <p className="text-sm text-slate-500">Manage roles and their hierarchy</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                </Button>
            </div>

            {/* Hierarchy visualization */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Role Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                            >
                                <div
                                    className={`w-2 h-12 rounded ${getHierarchyColor(role.hierarchy_level)}`}
                                    title={`Level ${role.hierarchy_level}`}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-slate-500" />
                                        <span className="font-medium">{role.display_name}</span>
                                        {role.is_system_role && (
                                            <Badge variant="secondary">System</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">{role.description}</p>
                                    <div className="flex gap-2 mt-1">
                                        {role.can_grant_access && (
                                            <Badge variant="outline" className="text-xs">Can Grant</Badge>
                                        )}
                                        {role.can_approve_requests && (
                                            <Badge variant="outline" className="text-xs">Can Approve</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-500">
                                        Level {role.hierarchy_level}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {role.user_count || 0} users
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                                    >
                                        {expandedRole === role.id ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </Button>
                                    {!role.is_system_role && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingRole(role)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteRole(role.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Expanded permissions view */}
            {expandedRole && (
                <PermissionsPanel
                    roleId={expandedRole}
                    permissions={permissions}
                    onClose={() => setExpandedRole(null)}
                    onSave={loadData}
                />
            )}

            {/* Add Role Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Role</DialogTitle>
                        <DialogDescription>Create a new role with permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role Name (System)</Label>
                                <Input
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                    placeholder="e.g., team_lead"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={newRole.display_name}
                                    onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                                    placeholder="e.g., Team Lead"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={newRole.description}
                                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                placeholder="Describe this role's purpose"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hierarchy Level (1-100)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={99}
                                value={newRole.hierarchy_level}
                                onChange={(e) => setNewRole({ ...newRole, hierarchy_level: parseInt(e.target.value) || 10 })}
                            />
                            <p className="text-xs text-slate-500">Higher levels have more authority</p>
                        </div>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={newRole.can_grant_access}
                                    onCheckedChange={(checked) => setNewRole({ ...newRole, can_grant_access: !!checked })}
                                />
                                Can Grant Access Directly
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={newRole.can_approve_requests}
                                    onCheckedChange={(checked) => setNewRole({ ...newRole, can_approve_requests: !!checked })}
                                />
                                Can Approve Requests
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddRole} disabled={!newRole.name || !newRole.display_name}>
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Permissions panel component
function PermissionsPanel({
    roleId,
    permissions,
    onClose,
    onSave,
}: {
    roleId: number;
    permissions: Permission[];
    onClose: () => void;
    onSave: () => void;
}) {
    const [rolePermissions, setRolePermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRolePermissions();
    }, [roleId]);

    const loadRolePermissions = async () => {
        try {
            const perms = await api.getRolePermissions(roleId);
            setRolePermissions((perms || []).map((p) => p.id));
        } catch (error) {
            console.error('Failed to load permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permId: number) => {
        setRolePermissions((prev) =>
            prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
        );
    };

    const handleSave = async () => {
        try {
            await api.setRolePermissions(roleId, rolePermissions);
            onSave();
        } catch (error) {
            console.error('Failed to save permissions:', error);
        }
    };

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const cat = perm.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading) {
        return <Card><CardContent className="p-4">Loading...</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Role Permissions</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save Permissions</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category} className="space-y-2">
                            <h4 className="font-medium capitalize text-slate-700">{category}</h4>
                            <div className="space-y-1">
                                {perms.map((perm) => (
                                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <Checkbox
                                            checked={rolePermissions.includes(perm.id)}
                                            onCheckedChange={() => togglePermission(perm.id)}
                                        />
                                        {perm.display_name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
