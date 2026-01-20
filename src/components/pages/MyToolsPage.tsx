import { useState, useEffect } from 'react';
import { User, Tool } from '../../lib/types';
import { listTools, getMyRequests, revokeAccess as revokeAccessAPI } from '../../lib/api';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Package, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MyToolsPageProps {
  currentUser: User;
}

interface ToolAccess {
  id: number;
  tool: Tool;
  access_level: string;
  granted_at: string;
  status: string;
}

export function MyToolsPage({ currentUser }: MyToolsPageProps) {
  const [revokeAccessItem, setRevokeAccessItem] = useState<ToolAccess | null>(null);
  const [userAccess, setUserAccess] = useState<ToolAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAccess();
  }, []);

  const loadUserAccess = async () => {
    try {
      setLoading(true);
      // Fetch user's access requests that are approved
      const requests = await getMyRequests();
      const approvedRequests = (requests || []).filter(req => req.status === 'APPROVED');

      // Fetch all tools
      const tools = await listTools();
      const safeTools = tools || [];

      // Map approved requests to tool access
      const toolAccess: ToolAccess[] = approvedRequests
        .filter(req => req.target_type === 'tool')
        .map(req => {
          const tool = safeTools.find(t => t.id === req.target_id);
          if (!tool) return null;
          return {
            id: req.id,
            tool,
            access_level: req.access_level || 'read',
            granted_at: req.created_at,
            status: 'active'
          };
        })
        .filter((item): item is ToolAccess => item !== null);

      setUserAccess(toolAccess);
    } catch (error) {
      console.error('Failed to load user access:', error);
      toast.error('Failed to load your tools');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeAccessItem) return;

    try {
      await revokeAccessAPI(currentUser.id, 'tool', revokeAccessItem.tool.id);
      toast.success('Access revoked successfully');
      setRevokeAccessItem(null);
      loadUserAccess();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      toast.error('Failed to revoke access');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>My Tools</h1>
          <p className="text-muted-foreground mt-1">Tools you currently have access to</p>
        </div>

        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your tools...</p>
        </div>
      </div>
    );
  }

  if (userAccess.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>My Tools</h1>
          <p className="text-muted-foreground mt-1">Tools you currently have access to</p>
        </div>

        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="mb-2">No active tool access</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            You don't have access to any tools yet. Request access to tools from the catalog.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>My Tools</h1>
          <p className="text-muted-foreground mt-1">Tools you currently have access to</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {userAccess.length} {userAccess.length === 1 ? 'Tool' : 'Tools'}
        </Badge>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool Name</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Privilege Level</TableHead>
              <TableHead>Granted Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userAccess.map((access) => {
              return (
                <TableRow key={access.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{access.tool.display_name || access.tool.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{access.tool.environment}</Badge>
                  </TableCell>
                  <TableCell>{access.access_level}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(access.granted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeAccessItem(access)}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!revokeAccessItem} onOpenChange={() => setRevokeAccessItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke your access? You'll need to request access again if you need it in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
