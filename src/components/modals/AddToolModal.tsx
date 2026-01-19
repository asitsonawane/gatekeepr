import { useState } from 'react';
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
import { mockApprovers } from '../../lib/mockData';
import { Plus, X } from 'lucide-react';

interface AddToolModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddToolModal({ open, onClose }: AddToolModalProps) {
  const [toolName, setToolName] = useState('');
  const [environment, setEnvironment] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [privilegeLevels, setPrivilegeLevels] = useState<
    Array<{ name: string; description: string }>
  >([]);
  const [newPrivilegeName, setNewPrivilegeName] = useState('');
  const [newPrivilegeDesc, setNewPrivilegeDesc] = useState('');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);

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
    console.log('Creating tool:', {
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
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Configure a new tool with privilege levels and approvers
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
                placeholder="e.g., GitHub, AWS Console"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                placeholder="e.g., Production, Staging, Development"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Development, Infrastructure"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this tool is used for..."
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
                      key={index}
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
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
