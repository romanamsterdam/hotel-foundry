import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Shield, Database, Users, FileText, Map, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../auth/useAuth';
import AccountMenu from '../components/layout/AccountMenu';

const adminTabs = [
  {
    id: 'sample-properties',
    label: 'Sample Properties',
    icon: Database,
    path: '/admin/sample-properties'
  },
  {
    id: 'benchmarks',
    label: 'Benchmarks',
    icon: BarChart3,
    path: '/admin/benchmarks'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    path: '/admin/users'
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: FileText,
    path: '/admin/deals'
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    path: '/admin/roadmap'
  },
  {
    id: 'consulting',
    label: 'Consulting',
    icon: Users,
    path: '/admin/consulting'
  }
];

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useAuth();
  
  const getActiveTab = () => {
    if (location.pathname === '/admin' || location.pathname.startsWith('/admin/sample-properties')) {
      return 'sample-properties';
    }
    if (location.pathname.startsWith('/admin/benchmarks')) {
      return 'benchmarks';
    }
    if (location.pathname.startsWith('/admin/users')) {
      return 'users';
    }
    if (location.pathname.startsWith('/admin/deals')) {
      return 'deals';
    }
    if (location.pathname.startsWith('/admin/roadmap')) {
      return 'roadmap';
    }
    if (location.pathname.startsWith('/admin/consulting')) {
      return 'consulting';
    }
    if (location.pathname.startsWith('/admin/consulting')) {
      return 'consulting';
    }
    if (location.pathname.startsWith('/admin/consulting')) {
      return 'consulting';
    }
    return 'sample-properties';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Console</h1>
                <p className="text-sm text-slate-600">Manage properties, users, and deals</p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" className="flex items-center space-x-2">
                  <span>← Back to Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={cn(
                    'flex items-center space-x-2 py-4 border-b-2 transition-colors',
                    isActive
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 max-w-7xl py-8">
        <Outlet />
      </main>
    </div>
  );
}