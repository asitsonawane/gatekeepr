import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../ui/tabs';
import { Clock, CheckCircle, XCircle, AlertCircle, UserPlus } from 'lucide-react';
import { AccessRequest, Tool } from '../../lib/types';
import * as api from '../../lib/api';

export function AccessRequestsPanel() {
    const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [showGrantDialog, setShowGrantDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [newRequest, setNewRequest] = useState({
        target_type: 'tool',
        target_id: 0,
        access_level: 'read',
        reason: '',
        duration_minutes: undefined as number | undefined,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [myReqs, pending, toolsData] = await Promise.all([
                api.getMyRequests(),
                api.getPendingRequests().catch(() => []),
                api.listTools(undefined, true),
            ]);
            setMyRequests(myReqs || []);
            setPendingRequests(pending || []);
            setTools(toolsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        try {
            await api.createAccessRequest(newRequest);
            setShowRequestDialog(false);
            setNewRequest({ target_type: 'tool', target_id: 0, access_level: 'read', reason: '', duration_minutes: undefined });
            loadData();
        } catch (error) {
            console.error('Failed to create request:', error);
            alert('Failed to create request');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.approveRequest(id);
            loadData();
        } catch (error) {
            console.error('Failed to approve:', error);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason) return;
        try {
            await api.rejectRequest(selectedRequest.id, rejectReason);
            setSelectedRequest(null);
            setRejectReason('');
            loadData();
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'REVOKED': return <AlertCircle className="w-4 h-4 text-slate-500" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            PENDING: 'secondary',
            APPROVED: 'default',
            REJECTED: 'destructive',
            REVOKED: 'outline',
            EXPIRED: 'outline',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

    if (loading) {
        return <div className="p-8 text-center">Loading access requests...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Access Requests</h3>
                    <p className="text-sm text-slate-500">Request and manage access to tools</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowRequestDialog(true)}>
                        Request Access
                    </Button>
                    <Button variant="outline" onClick={() => setShowGrantDialog(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Direct Grant
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="my-requests">
                <TabsList>
                    <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending Approval
                        {pendingRequests.length > 0 && (
                            <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-requests" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {myRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No access requests yet. Request access to tools you need.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {myRequests.map((req) => (
                                        <div key={req.id} className="p-4 hover:bg-slate-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(req.status)}
                                                    <div>
                                                        <div className="font-medium">
                                                            {req.target_type}: {req.target_name || req.target_id}
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {req.access_level} access • Requested {formatDate(req.created_at)}
                                                        </div>
                                                        {req.reason && (
                                                            <div className="text-sm text-slate-600 mt-1">
                                                                Reason: {req.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {getStatusBadge(req.status)}
                                                    {req.rejection_reason && (
                                                        <div className="text-sm text-red-500 mt-1">
                                                            {req.rejection_reason}
                                                        </div>
                                                    )}
                                                    {req.expires_at && (
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            Expires: {formatDate(req.expires_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {pendingRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No pending requests to approve.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingRequests.map((req) => (
                                        <div key={req.id} className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium">{req.user_email}</div>
                                                    <div className="text-sm text-slate-600">
                                                        Requesting <Badge variant="outline">{req.access_level}</Badge> access to{' '}
                                                        <span className="font-medium">{req.target_type}: {req.target_id}</span>
                                                    </div>
                                                    {req.reason && (
                                                        <div className="text-sm text-slate-500 mt-1">
                                                            Reason: {req.reason}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Requested {formatDate(req.created_at)}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(req.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedRequest(req)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Request Access Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Access</DialogTitle>
                        <DialogDescription>Request access to a tool or resource</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tool</Label>
                            <Select
                                value={newRequest.target_id.toString()}
                                onValueChange={(v) => setNewRequest({ ...newRequest, target_id: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tool" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tools.map((tool) => (
                                        <SelectItem key={tool.id} value={tool.id.toString()}>
                                            {tool.display_name || tool.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Access Level</Label>
                            <Select
                                value={newRequest.access_level}
                                onValueChange={(v) => setNewRequest({ ...newRequest, access_level: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="write">Write</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                value={newRequest.reason}
                                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                placeholder="Why do you need this access?"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (minutes, leave empty for permanent)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={newRequest.duration_minutes || ''}
                                onChange={(e) => setNewRequest({ ...newRequest, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="e.g., 60 for 1 hour"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateRequest} disabled={!newRequest.target_id}>
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Rejecting request from {selectedRequest?.user_email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for rejection</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Explain why this request is being rejected..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
