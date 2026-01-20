import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Plus, Edit2, Trash2, Users, UserPlus, X } from 'lucide-react';
import { Group, GroupMember } from '../../lib/types';
import * as api from '../../lib/api';

export function GroupsManagement() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [newGroup, setNewGroup] = useState({
        name: '',
        display_name: '',
        description: '',
    });

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await api.listGroups();
            setGroups(data || []);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGroupMembers = async (groupId: number) => {
        try {
            const data = await api.getGroupMembers(groupId);
            setGroupMembers(data || []);
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    };

    const handleCreateGroup = async () => {
        try {
            await api.createGroup(newGroup);
            setShowAddDialog(false);
            setNewGroup({ name: '', display_name: '', description: '' });
            loadGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        try {
            await api.deleteGroup(id);
            loadGroups();
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const handleSelectGroup = async (group: Group) => {
        setSelectedGroup(group);
        await loadGroupMembers(group.id);
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedGroup) return;
        try {
            await api.removeGroupMember(selectedGroup.id, userId);
            loadGroupMembers(selectedGroup.id);
            loadGroups();
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading groups...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">User Groups</h3>
                    <p className="text-sm text-slate-500">Manage user groups and memberships</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Groups List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Groups</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {groups.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No groups created yet</p>
                        ) : (
                            groups.map((group) => (
                                <div
                                    key={group.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedGroup?.id === group.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => handleSelectGroup(group)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-500" />
                                            <span className="font-medium">{group.display_name}</span>
                                        </div>
                                        <Badge variant="outline">{group.member_count || 0}</Badge>
                                    </div>
                                    {group.description && (
                                        <p className="text-sm text-slate-500 mt-1">{group.description}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Group Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                                {selectedGroup ? selectedGroup.display_name : 'Select a Group'}
                            </CardTitle>
                            {selectedGroup && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Add Members
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedGroup ? (
                            <div className="text-center py-12 text-slate-500">
                                Select a group to view its members
                            </div>
                        ) : groupMembers.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No members in this group</p>
                                <Button className="mt-4" variant="outline">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Members
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Added</TableHead>
                                        <TableHead>By</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                {member.first_name && member.last_name
                                                    ? `${member.first_name} ${member.last_name}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-slate-500">
                                                {new Date(member.added_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-slate-500">
                                                {member.added_by_email || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    <X className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Group Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create User Group</DialogTitle>
                        <DialogDescription>Create a new group to organize users</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Group Name (System)</Label>
                                <Input
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                    placeholder="e.g., engineering_team"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={newGroup.display_name}
                                    onChange={(e) => setNewGroup({ ...newGroup, display_name: e.target.value })}
                                    placeholder="e.g., Engineering Team"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={newGroup.description}
                                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                placeholder="What is this group for?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateGroup} disabled={!newGroup.name || !newGroup.display_name}>
                            Create Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
