import { useState } from 'react';
import { User, Tool } from '../../lib/types';
import { mockTools, mockUserAccess } from '../../lib/mockData';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RequestAccessModal } from '../modals/RequestAccessModal';
import { Search, CheckCircle } from 'lucide-react';

interface ToolCatalogPageProps {
  currentUser: User;
}

export function ToolCatalogPage({ currentUser }: ToolCatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const userAccessToolIds = mockUserAccess
    .filter((access) => access.userId === currentUser.id && access.status === 'active')
    .map((access) => access.toolId);

  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.environment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const hasAccess = (toolId: string) => userAccessToolIds.includes(toolId);

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
          currentUser={currentUser}
          open={!!selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
}
