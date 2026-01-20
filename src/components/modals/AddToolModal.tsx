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
import { createTool } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddToolModalProps {
  open: boolean;
  onClose: () => void;
  onToolAdded?: () => void;
}

export function AddToolModal({ open, onClose, onToolAdded }: AddToolModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !displayName) return;

    setIsSubmitting(true);
    try {
      await createTool({
        name,
        display_name: displayName,
        description,
        category,
        icon,
      });
      toast.success('Tool created successfully');
      if (onToolAdded) onToolAdded();
      onClose();

      // Reset form
      setName('');
      setDisplayName('');
      setDescription('');
      setCategory('');
      setIcon('🔧');
    } catch (error) {
      console.error('Failed to create tool:', error);
      toast.error('Failed to create tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Create a new tool in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tool-id">Tool ID (Slug)</Label>
            <Input
              id="tool-id"
              placeholder="e.g., github-prod"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Unique identifier for the tool (no spaces)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="e.g., GitHub Production"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Infrastructure, Development"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              placeholder="🔧"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-20"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !displayName || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
