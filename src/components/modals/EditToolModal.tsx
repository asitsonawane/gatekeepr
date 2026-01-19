import { useState, useEffect } from 'react';
import { Tool } from '../../lib/types';
import { mockPrivilegeLevels, mockToolApprovers, mockApprovers } from '../../lib/mockData';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Plus, X } from 'lucide-react';

interface EditToolModalProps {
  tool: Tool;
  open: boolean;
  onClose: () => void;
}

export function EditToolModal({ tool, open, onClose }: EditToolModalProps) {
  const [toolName, setToolName] = useState(tool.name);
  const [environment, setEnvironment] = useState(tool.environment);
  const [description, setDescription] = useState(tool.description);
  const [category, setCategory] = useState(tool.category);
  const [privilegeLevels, setPrivilegeLevels] = useState<
    Array<{ id?: string; name: string; description: string }>
  >([]);
  const [newPrivilegeName, setNewPrivilegeName] = useState('');
  const [newPrivilegeDesc, setNewPrivilegeDesc] = useState('');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);

  useEffect(() => {
    // Load existing privilege levels
    const levels = mockPrivilegeLevels
      .filter((p) => p.toolId === tool.id)
      .map((p) => ({ id: p.id, name: p.name, description: p.description }));
    setPrivilegeLevels(levels);

    // Load existing approvers
    const approverIds = mockToolApprovers
      .filter((ta) => ta.toolId === tool.id)
      .map((ta) => ta.approverId);
    setSelectedApprovers(approverIds);
  }, [tool.id]);

  const handleAddPrivilege = () => {
    if (newPrivilegeName && newPrivilegeDesc) {
      setPrivilegeLevels([
        ...privilegeLevels,
        { name: newPrivilegeName, description: newPrivilegeDesc },
      ]);
      setNewPrivilegeName('');
      setNewPrivilegeDesc('');
    }
  };

  const handleRemovePrivilege = (index: number) => {
    setPrivilegeLevels(privilegeLevels.filter((_, i) => i !== index));
  };

  const toggleApprover = (approverId: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(approverId)
        ? prev.filter((id) => id !== approverId)
        : [...prev, approverId]
    );
  };

  const handleSubmit = () => {
    console.log('Updating tool:', {
      toolId: tool.id,
      toolName,
      environment,
      description,
      category,
      privilegeLevels,
      selectedApprovers,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Update tool configuration, privilege levels, and approvers
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="privileges">Privilege Levels</TabsTrigger>
            <TabsTrigger value="approvers">Approvers</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input
                id="tool-name"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
          </TabsContent>

          <TabsContent value="privileges" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privilege-name">Privilege Level Name</Label>
                <Input
                  id="privilege-name"
                  placeholder="e.g., Read Only, Developer, Admin"
                  value={newPrivilegeName}
                  onChange={(e) => setNewPrivilegeName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privilege-desc">Description</Label>
                <Input
                  id="privilege-desc"
                  placeholder="Describe this privilege level..."
                  value={newPrivilegeDesc}
                  onChange={(e) => setNewPrivilegeDesc(e.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddPrivilege}
                disabled={!newPrivilegeName || !newPrivilegeDesc}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Privilege Level
              </Button>
            </div>

            {privilegeLevels.length > 0 && (
              <div className="space-y-2">
                <Label>Configured Privilege Levels</Label>
                <div className="border border-border rounded-lg p-3 space-y-2">
                  {privilegeLevels.map((level, index) => (
                    <div
                      key={level.id || index}
                      className="flex items-start justify-between bg-secondary/50 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{level.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {level.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePrivilege(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approvers" className="space-y-4 mt-4">
            <Label>Select Approvers</Label>
            <div className="border border-border rounded-lg p-4 space-y-3">
              {mockApprovers.map((approver) => (
                <div key={approver.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`approver-${approver.id}`}
                    checked={selectedApprovers.includes(approver.id)}
                    onCheckedChange={() => toggleApprover(approver.id)}
                  />
                  <label
                    htmlFor={`approver-${approver.id}`}
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant={approver.type === 'group' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {approver.type}
                    </Badge>
                    <span className="text-sm">{approver.name}</span>
                    {approver.email && (
                      <span className="text-xs text-muted-foreground">
                        ({approver.email})
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !toolName ||
              !environment ||
              !description ||
              !category ||
              privilegeLevels.length === 0 ||
              selectedApprovers.length === 0
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
