import React from 'react';
import { useAuth } from '../../auth/useAuth';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface RequireAdminProps {
  children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Checking admin permissions…</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Admin Access Only</h2>
            <p className="text-slate-600 mb-6">
              You need administrator privileges to access this section.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}