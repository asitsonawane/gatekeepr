import { useState } from 'react';
import { User } from '../lib/types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MyToolsPage } from './pages/MyToolsPage';
import { ToolCatalogPage } from './pages/ToolCatalogPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AdminToolsPage } from './pages/admin/AdminToolsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { RolesManagement } from './admin/RolesManagement';
import { GroupsManagement } from './admin/GroupsManagement';
import { AuditLogs } from './admin/AuditLogs';
import { AccessRequestsPanel } from './pages/AccessRequestsPanel';

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export type Page =
  | 'my-tools'
  | 'catalog'
  | 'approvals'
  | 'access-requests'
  | 'admin-tools'
  | 'admin-groups'
  | 'admin-users'
  | 'admin-roles'
  | 'admin-audit';

export function Dashboard({ currentUser, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<Page>('my-tools');

  const renderPage = () => {
    switch (currentPage) {
      case 'my-tools':
        return <MyToolsPage currentUser={currentUser} />;
      case 'catalog':
        return <ToolCatalogPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'access-requests':
        return <AccessRequestsPanel />;
      case 'admin-tools':
        return <AdminToolsPage />;
      case 'admin-groups':
        return <GroupsManagement />;
      case 'admin-users':
        return <AdminUsersPage />;
      case 'admin-roles':
        return <RolesManagement />;
      case 'admin-audit':
        return <AuditLogs />;
      default:
        return <MyToolsPage currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentUser={currentUser} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl mx-auto p-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
