import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { mockAccessRequests } from '../lib/mockData';
import { AccessRequest, User } from '../lib/types';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AccessRequestsProps {
  currentUser: User;
}

export function AccessRequests({ currentUser }: AccessRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const myRequests = mockAccessRequests.filter((req) => req.userId === currentUser.id);
  const pendingApprovals = currentUser.role === 'admin'
    ? mockAccessRequests.filter((req) => req.status === 'pending')
    : [];

  const handleApprove = () => {
    console.log('Approving request:', selectedRequest?.id, reviewComment);
    setSelectedRequest(null);
    setReviewComment('');
  };

  const handleReject = () => {
    console.log('Rejecting request:', selectedRequest?.id, reviewComment);
    setSelectedRequest(null);
    setReviewComment('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      default:
        return null;
    }
  };

  const RequestCard = ({ request }: { request: AccessRequest }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{request.toolName}</CardTitle>
            <CardDescription>
              Requested by {request.userName} • {request.requestedAt.toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Privilege Level:</span>
            <p>{request.privilegeLevelName}</p>
          </div>
          <div>
            <span className="text-slate-600">Status:</span>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(request.status)}
              <span className="capitalize">{request.status}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-sm text-slate-600">Reason:</span>
          <p className="text-sm mt-1 bg-slate-50 p-3 rounded-lg">{request.reason}</p>
        </div>

        {request.status !== 'pending' && request.reviewerComment && (
          <div>
            <span className="text-sm text-slate-600">Review Comment:</span>
            <p className="text-sm mt-1 bg-slate-50 p-3 rounded-lg">{request.reviewerComment}</p>
            <p className="text-xs text-slate-500 mt-2">
              Reviewed by {request.reviewerName} on {request.reviewedAt?.toLocaleDateString()}
            </p>
          </div>
        )}

        {request.status === 'pending' && currentUser.role === 'admin' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedRequest(request)}
            >
              Review
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-requests">
        <TabsList>
          <TabsTrigger value="my-requests">
            My Requests
            {myRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          {currentUser.role === 'admin' && (
            <TabsTrigger value="pending-approvals">
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4 mt-6">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600">No access requests yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Request access to tools from the "My Tools" tab
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        {currentUser.role === 'admin' && (
          <TabsContent value="pending-approvals" className="space-y-4 mt-6">
            {pendingApprovals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-600">No pending approvals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingApprovals.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Review Access Request</DialogTitle>
              <DialogDescription>
                {selectedRequest.userName} is requesting {selectedRequest.privilegeLevelName} access to{' '}
                {selectedRequest.toolName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-slate-600">Requested by:</span>
                  <p className="text-sm">{selectedRequest.userName} ({selectedRequest.userEmail})</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Reason:</span>
                  <p className="text-sm mt-1">{selectedRequest.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment">Review Comment (Optional)</Label>
                <Textarea
                  id="review-comment"
                  placeholder="Add a comment about your decision..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
              <Button onClick={handleApprove}>Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
