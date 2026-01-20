import { useState, useEffect } from 'react';
import { Tool } from '../../../lib/types';
import { listTools, deleteTool } from '../../../lib/api';
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
import { Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    try {
      const data = await listTools();
      setTools(data || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (toolId: number) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      await deleteTool(toolId);
      toast.success('Tool deleted successfully');
      loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
      toast.error('Failed to delete tool');
    }
  };



  if (loading && tools.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Tools Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure tools and their settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTools}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool Name</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No tools found. Add your first tool.
                </TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{tool.display_name || tool.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {tool.name}
                      </span>
                      {tool.description && (
                        <span className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                          {tool.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tool.environment || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tool.category || 'Uncategorized'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tool.is_active ? 'default' : 'destructive'} className="text-xs">
                      {tool.is_active ? 'Active' : 'Inactive'}
                    </Badge>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showAddModal && (
        <AddToolModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onToolAdded={loadTools}
        />
      )}

      {editingTool && (
        <EditToolModal
          tool={editingTool}
          open={!!editingTool}
          onClose={() => setEditingTool(null)}
          onToolUpdated={loadTools}
        />
      )}
    </div>
  );
}
