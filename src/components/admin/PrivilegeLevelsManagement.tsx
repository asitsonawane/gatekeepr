import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { mockPrivilegeLevels } from '../../lib/mockData';
import { Plus, Trash2, Edit } from 'lucide-react';

export function PrivilegeLevelsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLevel, setNewLevel] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [newPermission, setNewPermission] = useState('');

  const addPermission = () => {
    if (newPermission.trim() && !newLevel.permissions.includes(newPermission.trim())) {
      setNewLevel({
        ...newLevel,
        permissions: [...newLevel.permissions, newPermission.trim()],
      });
      setNewPermission('');
    }
  };

  const removePermission = (permission: string) => {
    setNewLevel({
      ...newLevel,
      permissions: newLevel.permissions.filter((p) => p !== permission),
    });
  };

  const handleAddLevel = () => {
    console.log('Adding privilege level:', newLevel);
    setShowAddDialog(false);
    setNewLevel({ name: '', description: '', permissions: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3>Privilege Levels</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Privilege Level
        </Button>
      </div>

      <div className="grid gap-4">
        {mockPrivilegeLevels.map((level) => (
          <Card key={level.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{level.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{level.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-600">Permissions:</span>
                {level.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary">
                    {perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Privilege Level</DialogTitle>
            <DialogDescription>
              Create a new privilege level with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="level-name">Level Name</Label>
              <Input
                id="level-name"
                value={newLevel.name}
                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                placeholder="e.g., Read Only, Admin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level-description">Description</Label>
              <Textarea
                id="level-description"
                value={newLevel.description}
                onChange={(e) => setNewLevel({ ...newLevel, description: e.target.value })}
                placeholder="Describe what this privilege level allows..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex gap-2">
                <Input
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value)}
                  placeholder="e.g., view, edit, delete"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPermission())}
                />
                <Button type="button" onClick={addPermission}>
                  Add
                </Button>
              </div>
              {newLevel.permissions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-lg">
                  {newLevel.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removePermission(perm)}
                    >
                      {perm} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLevel}
              disabled={!newLevel.name || !newLevel.description || newLevel.permissions.length === 0}
            >
              Add Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
