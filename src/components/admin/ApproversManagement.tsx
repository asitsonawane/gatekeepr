import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { mockApprovers } from '../../lib/mockData';
import { Plus, Trash2, Users, User } from 'lucide-react';

export function ApproversManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApprover, setNewApprover] = useState({
    type: 'user' as 'user' | 'group',
    name: '',
    email: '',
  });

  const handleAddApprover = () => {
    console.log('Adding approver:', newApprover);
    setShowAddDialog(false);
    setNewApprover({ type: 'user', name: '', email: '' });
  };

  const userApprovers = mockApprovers.filter((a) => a.type === 'user');
  const groupApprovers = mockApprovers.filter((a) => a.type === 'group');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3>Approvers</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Approver
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h4>Individual Users</h4>
            <Badge variant="secondary">{userApprovers.length}</Badge>
          </div>
          <div className="space-y-3">
            {userApprovers.map((approver) => (
              <Card key={approver.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{approver.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{approver.email}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h4>Groups</h4>
            <Badge variant="secondary">{groupApprovers.length}</Badge>
          </div>
          <div className="space-y-3">
            {groupApprovers.map((approver) => (
              <Card key={approver.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{approver.name}</CardTitle>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approver</DialogTitle>
            <DialogDescription>
              Add a user or group as an approver for tool access requests
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approver-type">Approver Type</Label>
              <Select
                value={newApprover.type}
                onValueChange={(value: 'user' | 'group') =>
                  setNewApprover({ ...newApprover, type: value, email: value === 'group' ? '' : newApprover.email })
                }
              >
                <SelectTrigger id="approver-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Individual User</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approver-name">
                {newApprover.type === 'user' ? 'User Name' : 'Group Name'}
              </Label>
              <Input
                id="approver-name"
                value={newApprover.name}
                onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })}
                placeholder={newApprover.type === 'user' ? 'e.g., John Doe' : 'e.g., Engineering Managers'}
              />
            </div>

            {newApprover.type === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="approver-email">Email</Label>
                <Input
                  id="approver-email"
                  type="email"
                  value={newApprover.email}
                  onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })}
                  placeholder="user@company.com"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddApprover}
              disabled={
                !newApprover.name ||
                (newApprover.type === 'user' && !newApprover.email)
              }
            >
              Add Approver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
