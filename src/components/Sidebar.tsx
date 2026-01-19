import { User } from '../lib/types';
import { Page } from './Dashboard';
import { Shield, LayoutDashboard, Package, CheckCircle, Settings, Users, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentUser: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentUser, currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    {
      id: 'my-tools' as Page,
      label: 'My Tools',
      icon: LayoutDashboard,
      roles: ['user', 'approver', 'admin'],
    },
    {
      id: 'catalog' as Page,
      label: 'Request Access',
      icon: Package,
      roles: ['user', 'approver', 'admin'],
    },
    {
      id: 'approvals' as Page,
      label: 'Approvals',
      icon: CheckCircle,
      roles: ['approver', 'admin'],
    },
  ];

  const adminItems = [
    {
      id: 'admin-tools' as Page,
      label: 'Tools',
      icon: Layers,
    },
    {
      id: 'admin-groups' as Page,
      label: 'Groups & Users',
      icon: Users,
    },
  ];

  const canAccess = (roles: string[]) => roles.includes(currentUser.role);

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg">AccessHub</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(
          (item) =>
            canAccess(item.roles) && (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  currentPage === item.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            )
        )}

        {currentUser.role === 'admin' && (
          <>
            <div className="pt-6 pb-2">
              <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground uppercase tracking-wider">
                <Settings className="w-3 h-3" />
                <span>Admin</span>
              </div>
            </div>
            {adminItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  currentPage === item.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-3 py-2">
          <p className="text-sm">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {currentUser.role}
          </p>
        </div>
      </div>
    </div>
  );
}
