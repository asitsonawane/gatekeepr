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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { mockTools, mockToolConfigs, mockPrivilegeLevels, mockApprovers } from '../../lib/mockData';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

export function ToolsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: '',
    icon: '🔧',
  });

  const handleAddTool = () => {
    console.log('Adding tool:', newTool);
    setShowAddDialog(false);
    setNewTool({ name: '', description: '', category: '', icon: '🔧' });
  };

  const ConfigureToolDialog = ({ toolId, open, onClose }: { toolId: string; open: boolean; onClose: () => void }) => {
    const tool = mockTools.find((t) => t.id === toolId);
    const config = mockToolConfigs.find((c) => c.toolId === toolId);
    const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>(config?.privilegeLevels || []);
    const [selectedApprovers, setSelectedApprovers] = useState<string[]>(config?.approvers || []);

    const togglePrivilege = (id: string) => {
      setSelectedPrivileges((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    };

    const toggleApprover = (id: string) => {
      setSelectedApprovers((prev) =>
        prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
      );
    };

    const handleSave = () => {
      console.log('Saving config:', { toolId, selectedPrivileges, selectedApprovers });
      onClose();
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure {tool?.name}</DialogTitle>
            <DialogDescription>
              Set privilege levels and approvers for this tool
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Available Privilege Levels</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {mockPrivilegeLevels.map((level) => (
                  <div key={level.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`priv-${level.id}`}
                      checked={selectedPrivileges.includes(level.id)}
                      onCheckedChange={() => togglePrivilege(level.id)}
                    />
                    <label
                      htmlFor={`priv-${level.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span>{level.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {level.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">{level.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Approvers</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {mockApprovers.map((approver) => (
                  <div key={approver.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`approver-${approver.id}`}
                      checked={selectedApprovers.includes(approver.id)}
                      onCheckedChange={() => toggleApprover(approver.id)}
                    />
                    <label
                      htmlFor={`approver-${approver.id}`}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <Badge variant={approver.type === 'group' ? 'default' : 'outline'}>
                        {approver.type}
                      </Badge>
                      <span>{approver.name}</span>
                      {approver.email && (
                        <span className="text-sm text-slate-500">({approver.email})</span>
                      )}
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
            <Button onClick={handleSave}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3>Tools</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <div className="grid gap-4">
        {mockTools.map((tool) => {
          const config = mockToolConfigs.find((c) => c.toolId === tool.id);
          const approvers = mockApprovers.filter((a) => config?.approvers.includes(a.id));

          return (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{tool.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">{tool.description}</p>
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <span className="text-slate-600">Approvers:</span>
                  {approvers.map((approver) => (
                    <Badge key={approver.id} variant="secondary">
                      {approver.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
            <DialogDescription>
              Add a new tool to the access management system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input
                id="tool-name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                placeholder="e.g., GitHub, AWS Console"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-category">Category</Label>
              <Input
                id="tool-category"
                value={newTool.category}
                onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                placeholder="e.g., Development, Infrastructure"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-icon">Icon (Emoji)</Label>
              <Input
                id="tool-icon"
                value={newTool.icon}
                onChange={(e) => setNewTool({ ...newTool, icon: e.target.value })}
                placeholder="🔧"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-description">Description</Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                placeholder="Describe what this tool is used for..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTool}
              disabled={!newTool.name || !newTool.category || !newTool.description}
            >
              Add Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTool && (
        <ConfigureToolDialog
          toolId={selectedTool}
          open={!!selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
}
