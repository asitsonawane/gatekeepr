import { useState } from 'react';
import { AccessRequest, User } from '../../lib/types';
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

interface ReviewRequestModalProps {
  request: AccessRequest;
  currentUser: User;
  open: boolean;
  onClose: () => void;
}

export function ReviewRequestModal({
  request,
  currentUser,
  open,
  onClose,
}: ReviewRequestModalProps) {
  const [comment, setComment] = useState('');

  const handleApprove = () => {
    console.log('Approving request:', request.id, comment);
    onClose();
  };

  const handleReject = () => {
    console.log('Rejecting request:', request.id, comment);
    onClose();
  };

  const isReviewed = request.status !== 'pending';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isReviewed ? 'Request Details' : 'Review Access Request'}
          </DialogTitle>
          <DialogDescription>
            {request.toolName} - {request.toolEnvironment}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Requested by</Label>
              <p className="text-sm mt-1">{request.userName}</p>
              <p className="text-xs text-muted-foreground">{request.userEmail}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Requested on</Label>
              <p className="text-sm mt-1">{request.requestedAt.toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Privilege Level</Label>
            <div className="mt-1">
              <Badge variant="secondary">{request.privilegeLevelName}</Badge>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Business Justification</Label>
            <div className="mt-2 bg-secondary/50 rounded-lg p-3">
              <p className="text-sm">{request.reason}</p>
            </div>
          </div>

          {isReviewed && (
            <>
              <div className="pt-4 border-t">
                <Label className="text-xs text-muted-foreground">Review Status</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      request.status === 'approved'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {request.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    by {request.reviewerName} on {request.reviewedAt?.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.reviewerComment && (
                <div>
                  <Label className="text-xs text-muted-foreground">Review Comment</Label>
                  <div className="mt-2 bg-secondary/50 rounded-lg p-3">
                    <p className="text-sm">{request.reviewerComment}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {!isReviewed && (
            <div className="space-y-2">
              <Label htmlFor="comment">Approval Notes (Optional)</Label>
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
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
              <Button onClick={handleApprove}>Approve</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
