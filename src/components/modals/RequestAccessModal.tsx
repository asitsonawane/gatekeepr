import { useState } from 'react';
import { Tool } from '../../lib/types';
import { createAccessRequest } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RequestAccessModalProps {
  tool: Tool;
  open: boolean;
  onClose: () => void;
}

const ACCESS_LEVELS = [
  { id: 'read', name: 'Read', description: 'Read-only access' },
  { id: 'write', name: 'Write', description: 'Read and write access' },
  { id: 'admin', name: 'Admin', description: 'Full administrative access' },
];

export function RequestAccessModal({
  tool,
  open,
  onClose,
}: RequestAccessModalProps) {
  const [accessLevel, setAccessLevel] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accessLevel || !reason.trim()) return;

    try {
      setSubmitting(true);
      await createAccessRequest({
        target_type: 'tool',
        target_id: tool.id,
        access_level: accessLevel,
        reason: reason.trim(),
      });

      setSubmitted(true);
      toast.success('Access request submitted successfully');

      setTimeout(() => {
        setSubmitted(false);
        setAccessLevel('');
        setReason('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit access request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3>Request Submitted</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your access request has been sent for approval
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Access</DialogTitle>
          <DialogDescription>
            {tool.name} - {tool.environment}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="privilege-level">Access Level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger id="privilege-level">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    <div className="flex flex-col gap-1">
                      <span>{level.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {level.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Business Justification</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need access..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!accessLevel || !reason.trim() || submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
