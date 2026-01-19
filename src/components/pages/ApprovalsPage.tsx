import { useState } from 'react';
import { User, AccessRequest } from '../../lib/types';
import { mockAccessRequests, mockToolApprovers, mockApprovers } from '../../lib/mockData';
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
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ApprovalsPageProps {
  currentUser: User;
}

export function ApprovalsPage({ currentUser }: ApprovalsPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  // Get approver IDs that the current user manages
  const userApproverIds = mockApprovers
    .filter((a) => a.type === 'user' && a.email === currentUser.email)
    .map((a) => a.id);

  // Get all tool IDs this user can approve
  const approvableToolIds = mockToolApprovers
    .filter((ta) => userApproverIds.includes(ta.approverId))
    .map((ta) => ta.toolId);

  // Filter requests
  const pendingRequests = mockAccessRequests.filter(
    (req) => req.status === 'pending' && approvableToolIds.includes(req.toolId)
  );

  const reviewedRequests = mockAccessRequests.filter(
    (req) => req.status !== 'pending' && approvableToolIds.includes(req.toolId)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
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
              <TableHead>Tool</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Privilege</TableHead>
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
                    <p className="text-sm">{request.userName}</p>
                    <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell>{request.toolName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{request.toolEnvironment}</Badge>
                </TableCell>
                <TableCell>{request.privilegeLevelName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {request.requestedAt.toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                  {request.status === 'pending' ? (
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
          currentUser={currentUser}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
