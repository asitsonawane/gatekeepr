import { useState, useEffect } from 'react';
import { AccessRequest } from '../../lib/types';
import { approveRequest, rejectRequest, getTool } from '../../lib/api';
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
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReviewRequestModalProps {
  request: AccessRequest;
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

export function ReviewRequestModal({
  request,
  open,
  onClose,
  onReviewed,
}: ReviewRequestModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetName, setTargetName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request.target_type === 'tool' && request.target_id) {
      loadToolDetails();
    } else {
      setTargetName(`${request.target_type} #${request.target_id}`);
    }
  }, [request]);

  const loadToolDetails = async () => {
    try {
      setLoading(true);
      const tool = await getTool(Number(request.target_id));
      setTargetName(tool.display_name || tool.name);
    } catch (error) {
      console.error('Failed to load tool details:', error);
      setTargetName(`Tool #${request.target_id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveRequest(request.id);
      toast.success('Request approved');
      if (onReviewed) onReviewed();
      onClose();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment) {
      toast.error('Rejection reason is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectRequest(request.id, comment);
      toast.success('Request rejected');
      if (onReviewed) onReviewed();
      onClose();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReviewed = request.status !== 'PENDING';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isReviewed ? 'Request Details' : 'Review Access Request'}
          </DialogTitle>
          <DialogDescription>
            {loading ? 'Loading details...' : targetName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Requested by</Label>
              <p className="text-sm mt-1">{request.user_email || 'Unknown User'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Requested on</Label>
              <p className="text-sm mt-1">{new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Access Level</Label>
            <div className="mt-1">
              <Badge variant="secondary">{request.access_level || 'Default'}</Badge>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Business Justification</Label>
            <div className="mt-2 bg-secondary/50 rounded-lg p-3">
              <p className="text-sm">{request.reason || 'No justification provided'}</p>
            </div>
          </div>

          {isReviewed && (
            <div className="pt-4 border-t">
              <Label className="text-xs text-muted-foreground">Review Status</Label>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    request.status === 'APPROVED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </div>
          )}

          {!isReviewed && (
            <div className="space-y-2">
              <Label htmlFor="comment">
                Approval/Rejection Notes {isReviewed ? '' : '(Required to Reject)'}
              </Label>
              <Textarea
                id="comment"
                placeholder="Add notes about your decision..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {isReviewed ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !comment}
              >
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
