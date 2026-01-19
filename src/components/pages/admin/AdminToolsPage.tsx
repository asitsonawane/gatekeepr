import { useState } from 'react';
import { Tool } from '../../../lib/types';
import { mockTools, mockPrivilegeLevels, mockToolApprovers, mockApprovers } from '../../../lib/mockData';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { AddToolModal } from '../../modals/AddToolModal';
import { EditToolModal } from '../../modals/EditToolModal';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function AdminToolsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const getToolPrivilegeLevels = (toolId: string) => {
    return mockPrivilegeLevels.filter((p) => p.toolId === toolId);
  };

  const getToolApprovers = (toolId: string) => {
    const approverIds = mockToolApprovers
      .filter((ta) => ta.toolId === toolId)
      .map((ta) => ta.approverId);
    return mockApprovers.filter((a) => approverIds.includes(a.id));
  };

  const handleDelete = (toolId: string) => {
    console.log('Deleting tool:', toolId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Tools Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure tools, privilege levels, and approvers
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool Name</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Privilege Levels</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTools.map((tool) => {
              const privilegeLevels = getToolPrivilegeLevels(tool.id);
              const approvers = getToolApprovers(tool.id);

              return (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{tool.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tool.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tool.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {privilegeLevels.map((level) => (
                        <Badge key={level.id} variant="outline" className="text-xs">
                          {level.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {approvers.map((approver) => (
                        <Badge
                          key={approver.id}
                          variant={approver.type === 'group' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {approver.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTool(tool)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tool.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {showAddModal && (
        <AddToolModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      )}

      {editingTool && (
        <EditToolModal
          tool={editingTool}
          open={!!editingTool}
          onClose={() => setEditingTool(null)}
        />
      )}
    </div>
  );
}
