import { useState, useEffect } from 'react';
import { AccessRequest } from '../../lib/types';
import { getPendingRequests, listAccessRequests } from '../../lib/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ReviewRequestModal } from '../modals/ReviewRequestModal';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalsPageProps { }

export function ApprovalsPage({ }: ApprovalsPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [reviewedRequests, setReviewedRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [pending, allRequests] = await Promise.all([
        getPendingRequests(),
        listAccessRequests()
      ]);

      setPendingRequests(pending || []);

      // Get reviewed requests (approved or rejected)
      const reviewed = (allRequests || []).filter(
        req => req.status === 'APPROVED' || req.status === 'REJECTED'
      );
      setReviewedRequests(reviewed);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const RequestsTable = ({ requests }: { requests: AccessRequest[] }) => {
    if (requests.length === 0) {
      return (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No requests to display</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Request Type</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <p className="text-sm">{request.user_email}</p>
                  </div>
                </TableCell>
                <TableCell>{request.request_type}</TableCell>
                <TableCell>
                  <Badge variant="outline">{request.access_level || 'N/A'}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                  {request.status === 'PENDING' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      View Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Approvals</h1>
          <p className="text-muted-foreground mt-1">Review access requests for tools you manage</p>
        </div>

        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Approvals</h1>
        <p className="text-muted-foreground mt-1">Review access requests for tools you manage</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <RequestsTable requests={pendingRequests} />
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <RequestsTable requests={reviewedRequests} />
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <ReviewRequestModal
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onReviewed={loadRequests}
        />
      )}
    </div>
  );
}
