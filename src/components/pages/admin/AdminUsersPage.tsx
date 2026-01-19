import { useState } from 'react';
import { mockUsers, mockGroups } from '../../../lib/mockData';
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
import { Edit, Trash2 } from 'lucide-react';

export function AdminUsersPage() {
  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Users Management</h1>
        <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
      </div>

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
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
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
    </div>
  );
}
