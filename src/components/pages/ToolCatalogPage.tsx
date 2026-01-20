import { useState, useEffect } from 'react';
import { Tool } from '../../lib/types';
import { listTools, getMyRequests } from '../../lib/api';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RequestAccessModal } from '../modals/RequestAccessModal';
import { Search, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ToolCatalogPageProps { }

export function ToolCatalogPage({ }: ToolCatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [userAccessToolIds, setUserAccessToolIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toolsData, requests] = await Promise.all([
        listTools(),
        getMyRequests()
      ]);

      const safeTools = toolsData || [];
      const safeRequests = requests || [];

      setTools(safeTools);

      // Get tool IDs from approved requests
      const approvedToolIds = safeRequests
        .filter(req => req.status === 'APPROVED' && req.target_type === 'tool')
        .map(req => req.target_id);

      setUserAccessToolIds(approvedToolIds);
    } catch (error) {
      console.error('Failed to load tools:', error);
      toast.error('Failed to load tools catalog');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.environment?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (tool.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const hasAccess = (toolId: number) => userAccessToolIds.includes(toolId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Tool Catalog</h1>
          <p className="text-muted-foreground mt-1">Browse and request access to tools</p>
        </div>

        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Tool Catalog</h1>
        <p className="text-muted-foreground mt-1">Browse and request access to tools</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="border border-border rounded-lg bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4>{tool.name}</h4>
                  {hasAccess(tool.id) && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {tool.environment}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {tool.description}
            </p>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {tool.category}
              </Badge>
            </div>

            <div className="mt-4">
              {hasAccess(tool.id) ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Access Granted
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedTool(tool)}
                >
                  Request Access
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">No tools found matching your search</p>
        </div>
      )}

      {selectedTool && (
        <RequestAccessModal
          tool={selectedTool}
          open={!!selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
}
