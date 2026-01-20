import { useState, useEffect } from 'react';
import { Tool } from '../../lib/types';
import { updateTool } from '../../lib/api';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditToolModalProps {
  tool: Tool;
  open: boolean;
  onClose: () => void;
  onToolUpdated?: () => void;
}

export function EditToolModal({ tool, open, onClose, onToolUpdated }: EditToolModalProps) {
  const [displayName, setDisplayName] = useState(tool.display_name);
  const [description, setDescription] = useState(tool.description || '');
  const [category, setCategory] = useState(tool.category || '');
  const [icon, setIcon] = useState(tool.icon || '🔧');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDisplayName(tool.display_name);
    setDescription(tool.description || '');
    setCategory(tool.category || '');
    setIcon(tool.icon || '🔧');
  }, [tool]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateTool(tool.id, {
        name: tool.name, // Name usually shouldn't change if it's the ID/slug, but passing it if required
        display_name: displayName,
        description,
        category,
        icon,
      });
      toast.success('Tool updated successfully');
      if (onToolUpdated) onToolUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update tool:', error);
      toast.error('Failed to update tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Update tool details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tool-id">Tool ID</Label>
            <Input
              id="tool-id"
              value={tool.name}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-20"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!displayName || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
