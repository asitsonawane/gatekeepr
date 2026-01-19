import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { mockToolConfigs, mockPrivilegeLevels, mockApprovers } from '../lib/mockData';
import { Tool, User } from '../lib/types';
import { CheckCircle2, Users } from 'lucide-react';

interface RequestAccessDialogProps {
  tool: Tool;
  currentUser: User;
  open: boolean;
  onClose: () => void;
}

export function RequestAccessDialog({ tool, currentUser, open, onClose }: RequestAccessDialogProps) {
  const [privilegeLevelId, setPrivilegeLevelId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toolConfig = mockToolConfigs.find((config) => config.toolId === tool.id);
  const availablePrivilegeLevels = mockPrivilegeLevels.filter((p) =>
    toolConfig?.privilegeLevels.includes(p.id)
  );
  const approvers = mockApprovers.filter((a) =>
    toolConfig?.approvers.includes(a.id)
  );

  const handleSubmit = () => {
    // In production, this would create a new access request
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
            <CheckCircle2 className="w-16 h-16 text-green-600" />
            <div>
              <h3 className="text-lg">Request Submitted!</h3>
              <p className="text-sm text-slate-600 mt-2">
                Your access request for {tool.name} has been sent for approval.
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
          <DialogTitle>Request Access to {tool.name}</DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="privilege-level">Privilege Level</Label>
            <Select value={privilegeLevelId} onValueChange={setPrivilegeLevelId}>
              <SelectTrigger id="privilege-level">
                <SelectValue placeholder="Select privilege level" />
              </SelectTrigger>
              <SelectContent>
                {availablePrivilegeLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    <div className="flex flex-col">
                      <span>{level.name}</span>
                      <span className="text-xs text-slate-500">{level.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {privilegeLevelId && (
              <div className="flex flex-wrap gap-1 mt-2">
                {mockPrivilegeLevels
                  .find((p) => p.id === privilegeLevelId)
                  ?.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Business Justification</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need access to this tool..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Approvers
            </Label>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {approvers.map((approver) => (
                <div key={approver.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={approver.type === 'group' ? 'default' : 'outline'}>
                    {approver.type}
                  </Badge>
                  <span>{approver.name}</span>
                  {approver.email && (
                    <span className="text-slate-500 text-xs">({approver.email})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!privilegeLevelId || !reason.trim()}
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
