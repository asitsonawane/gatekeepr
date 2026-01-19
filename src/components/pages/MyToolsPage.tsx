import { useState } from 'react';
import { User, UserAccess } from '../../lib/types';
import { mockUserAccess, mockTools, mockPrivilegeLevels } from '../../lib/mockData';
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
import { Package, XCircle } from 'lucide-react';

interface MyToolsPageProps {
  currentUser: User;
}

export function MyToolsPage({ currentUser }: MyToolsPageProps) {
  const [revokeAccess, setRevokeAccess] = useState<UserAccess | null>(null);

  const userAccess = mockUserAccess.filter(
    (access) => access.userId === currentUser.id && access.status === 'active'
  );

  const handleRevoke = () => {
    console.log('Revoking access:', revokeAccess?.id);
    setRevokeAccess(null);
  };

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
              const tool = mockTools.find((t) => t.id === access.toolId);
              const privilege = mockPrivilegeLevels.find(
                (p) => p.id === access.privilegeLevelId
              );

              return (
                <TableRow key={access.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{tool?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tool?.environment}</Badge>
                  </TableCell>
                  <TableCell>{privilege?.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {access.grantedAt.toLocaleDateString()}
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
                      onClick={() => setRevokeAccess(access)}
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

      <AlertDialog open={!!revokeAccess} onOpenChange={() => setRevokeAccess(null)}>
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
