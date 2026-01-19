import { useState, useEffect } from 'react';
import { Group } from '../../lib/types';
import { mockUsers } from '../../lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

interface EditGroupModalProps {
  group: Group;
  open: boolean;
  onClose: () => void;
}

export function EditGroupModal({ group, open, onClose }: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group.memberIds);

  useEffect(() => {
    setGroupName(group.name);
    setDescription(group.description);
    setSelectedMembers(group.memberIds);
  }, [group]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    console.log('Updating group:', {
      groupId: group.id,
      groupName,
      description,
      selectedMembers,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>Update group details and members</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div className="border border-border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={() => toggleMember(user.id)}
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!groupName || !description}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
