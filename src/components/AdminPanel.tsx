import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ToolsManagement } from './admin/ToolsManagement';
import { PrivilegeLevelsManagement } from './admin/PrivilegeLevelsManagement';
import { ApproversManagement } from './admin/ApproversManagement';
import { Settings, Shield, Users } from 'lucide-react';

export function AdminPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>
            Manage tools, privilege levels, and approvers
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tools">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="tools" className="gap-2">
            <Settings className="w-4 h-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="privileges" className="gap-2">
            <Shield className="w-4 h-4" />
            Privilege Levels
          </TabsTrigger>
          <TabsTrigger value="approvers" className="gap-2">
            <Users className="w-4 h-4" />
            Approvers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          <ToolsManagement />
        </TabsContent>

        <TabsContent value="privileges" className="mt-6">
          <PrivilegeLevelsManagement />
        </TabsContent>

        <TabsContent value="approvers" className="mt-6">
          <ApproversManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
