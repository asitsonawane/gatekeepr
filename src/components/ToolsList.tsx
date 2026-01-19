import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RequestAccessDialog } from './RequestAccessDialog';
import { mockTools, mockUserAccess, mockPrivilegeLevels } from '../lib/mockData';
import { Tool, User } from '../lib/types';
import { Search, Lock, Unlock } from 'lucide-react';

interface ToolsListProps {
  currentUser: User;
}

export function ToolsList({ currentUser }: ToolsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const userAccess = mockUserAccess.filter((access) => access.userId === currentUser.id);
  
  const categories = ['all', ...Array.from(new Set(mockTools.map((t) => t.category)))];

  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getToolAccess = (toolId: string) => {
    return userAccess.find((access) => access.toolId === toolId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
          <CardDescription>Browse and request access to tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const access = getToolAccess(tool.id);
          const privilegeLevel = access
            ? mockPrivilegeLevels.find((p) => p.id === access.privilegeLevelId)
            : null;

          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{tool.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  {access ? (
                    <Unlock className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{tool.description}</p>
                
                {access ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Access Level:</span>
                      <Badge variant="secondary">{privilegeLevel?.name}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      Granted on {access.grantedAt.toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setSelectedTool(tool)}
                  >
                    Request Access
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTool && (
        <RequestAccessDialog
          tool={selectedTool}
          currentUser={currentUser}
          open={!!selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
}
