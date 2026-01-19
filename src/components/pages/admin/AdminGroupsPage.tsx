import { useState } from 'react';
import { Group } from '../../../lib/types';
import { mockGroups, mockUsers } from '../../../lib/mockData';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AddGroupModal } from '../../modals/AddGroupModal';
import { EditGroupModal } from '../../modals/EditGroupModal';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

export function AdminGroupsPage() {
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleDeleteGroup = (groupId: string) => {
    console.log('Deleting group:', groupId);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Groups & Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage groups and user roles
        </p>
      </div>

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddGroupModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>

          <div className="border border-border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockGroups.map((group) => {
                  const members = mockUsers.filter((u) =>
                    group.memberIds.includes(u.id)
                  );

                  return (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{group.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {group.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {members.map((member) => (
                            <Badge key={member.id} variant="secondary" className="text-xs">
                              {member.name}
                            </Badge>
                          ))}
                          {members.length === 0 && (
                            <span className="text-sm text-muted-foreground">
                              No members
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGroup(group)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <div className="border border-border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => {
                  const userGroups = mockGroups.filter((g) =>
                    g.memberIds.includes(user.id)
                  );

                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'default'
                              : user.role === 'approver'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userGroups.map((group) => (
                            <Badge key={group.id} variant="outline" className="text-xs">
                              {group.name}
                            </Badge>
                          ))}
                          {userGroups.length === 0 && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {showAddGroupModal && (
        <AddGroupModal
          open={showAddGroupModal}
          onClose={() => setShowAddGroupModal(false)}
        />
      )}

      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          open={!!editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}
