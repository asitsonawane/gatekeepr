import { useState } from 'react';
import { Tool, User } from '../../lib/types';
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
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface RequestAccessModalProps {
  tool: Tool;
  currentUser: User;
  open: boolean;
  onClose: () => void;
}

export function RequestAccessModal({
  tool,
  currentUser,
  open,
  onClose,
}: RequestAccessModalProps) {
  const [privilegeLevelId, setPrivilegeLevelId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const privilegeLevels = mockPrivilegeLevels.filter((p) => p.toolId === tool.id);
  const toolApproverIds = mockToolApprovers
    .filter((ta) => ta.toolId === tool.id)
    .map((ta) => ta.approverId);
  const approvers = mockApprovers.filter((a) => toolApproverIds.includes(a.id));

  const handleSubmit = () => {
    console.log('Submitting request:', {
      toolId: tool.id,
      privilegeLevelId,
      reason,
      userId: currentUser.id,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setPrivilegeLevelId('');
      setReason('');
      onClose();
    }, 2000);
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
            <Label htmlFor="privilege-level">Privilege Level</Label>
            <Select value={privilegeLevelId} onValueChange={setPrivilegeLevelId}>
              <SelectTrigger id="privilege-level">
                <SelectValue placeholder="Select privilege level" />
              </SelectTrigger>
              <SelectContent>
                {privilegeLevels.map((level) => (
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

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Approvers</Label>
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              {approvers.map((approver) => (
                <div key={approver.id} className="flex items-center gap-2">
                  <Badge variant={approver.type === 'group' ? 'default' : 'secondary'} className="text-xs">
                    {approver.type}
                  </Badge>
                  <span className="text-sm">{approver.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!privilegeLevelId || !reason.trim()}>
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
