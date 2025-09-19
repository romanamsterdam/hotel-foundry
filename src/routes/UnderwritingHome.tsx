import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { listDeals, removeDeal, saveDeals } from '../lib/dealStore';
import { sampleDeals } from '../data/sampleDeals';
import { Deal } from '../types/deal';
import { totalRooms } from '../lib/rooms';
import { eur0, dateShort } from '../lib/format';
import { formatDate, formatRelativeTime } from '../lib/utils';
import SafeImage from '../components/SafeImage';
import { lastSavedLabel } from '../lib/utils';
import { getDataSource } from '../lib/datasource';
import { useToast } from '../components/ui/toast';
import { useAuth } from '../auth/AuthProvider';

export default function UnderwritingHome() {
  const { user, status } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]); // Keep for local storage deals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load projects from Supabase when authenticated
  const loadProjects = async () => {
    if (status !== "authenticated") return;
    
    setLoadingProjects(true);
    try {
      const ds = await getDataSource();
      const result = await ds.listMyProjects();
      if (result.error) {
        toast.error(result.error);
      } else {
        setProjects(result.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load local deals (backward compatibility)
  useEffect(() => {
    setDeals(listDeals());
  }, []);

  // Load projects when auth status changes
  useEffect(() => {
    if (status === "authenticated") {
      loadProjects();
    } else if (status === "unauthenticated") {
      setProjects([]);
    }
  }, [status]);

  const handleLoadSamples = async () => {
    if (status !== "authenticated") {
      toast.error("Please sign in to load sample deals");
      return;
    }
    
    setLoadingSamples(true);
    try {
      const ds = await getDataSource();
      if (!ds.seedSampleDeals) {
        throw new Error("Sample deals not available");
      }
      
      const result = await ds.seedSampleDeals();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} sample deals added to your account`);
        // Refresh the projects list
        await loadProjects();
      }
    } catch (error: any) {
      console.error('Failed to seed sample deals:', error);
      toast.error('Failed to load sample deals');
    } finally {
      setLoadingSamples(false);
    }
  };

  // Combine projects and local deals for display
  const allDeals = useMemo(() => {
    // Convert projects to deal format for display
    const projectDeals = projects.map(project => ({
      id: project.id,
      name: project.name,
      location: project.kpis?.location || 'Location TBD',
      createdAt: project.created_at || new Date().toISOString(),
      updatedAt: project.updated_at || new Date().toISOString(),
      roomTypes: project.kpis?.roomTypes || [],
      purchasePrice: project.kpis?.purchasePrice || 0,
      currency: project.currency || 'EUR',
      photoUrl: project.kpis?.photoUrl,
      // Add other required Deal properties with defaults
      address: '',
      propertyType: project.kpis?.propertyType || 'Boutique',
      stars: project.kpis?.starRating || 4,
      gfaSqm: project.kpis?.gfaSqm || 0,
      amenities: {
        spa: false, pool: false, restaurant: false, bar: false,
        gym: false, meetingsEvents: false, parking: false, roomService: false
      },
      assumptions: {}
    }));
    
    // Combine with local deals (for backward compatibility)
    return [...projectDeals, ...deals];
  }, [projects, deals]);

  const handleDelete = (id: string) => {
    // Check if it's a project or local deal
    const isProject = projects.some(p => p.id === id);
    
    if (isProject) {
      // Delete from Supabase
      getDataSource().then(async (ds) => {
        if (ds.deleteProject) {
          const result = await ds.deleteProject(id);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success('Project deleted');
            await loadProjects(); // Refresh list
          }
        }
      });
    } else {
      // Delete from local storage
      removeDeal(id);
      setDeals(listDeals());
    }
    
    setShowDeleteConfirm(null);
  };

  const handleOpen = (id: string) => {
    navigate(`/underwriting/${id}`);
  };

  // Show loading state while auth is initializing
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (status === "unauthenticated") {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-12 text-center">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Sign in to view your deals</h3>
          <p className="text-slate-600 mb-6">Access your underwriting projects and create new analyses</p>
          <Link to="/signin">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
              Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Deals</h1>
          <p className="text-slate-600">Manage your hotel underwriting projects</p>
        </div>
        <Link to="/underwriting/new">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Deal</span>
          </Button>
        </Link>
      </div>

      {loadingProjects ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your deals...</p>
          </CardContent>
        </Card>
      ) : allDeals.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No deals yet</h3>
            <p className="text-slate-600 mb-6">Get started by creating your first deal or loading sample data</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/underwriting/new">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                  Create Your First Deal
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLoadSamples}>
                {loadingSamples ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                    Loading Samples...
                  </>
                ) : (
                  'Load Sample Deals'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allDeals.map((deal) => (
            <Card key={deal.id} className="border-slate-200 hover:shadow-lg transition-all duration-300">
              {/* Photo Banner */}
              <div className="relative h-32 overflow-hidden rounded-t-lg">
                <SafeImage
                  src={deal.photoUrl}
                  fallbackText={deal.name}
                  className="w-full h-full"
                  alt={deal.name}
                />
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{deal.name}</CardTitle>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                    {deal.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{deal.location}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Created: {formatDate(deal.createdAt)}</div>
                    <div>Last saved: {lastSavedLabel(deal.updatedAt)}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Rooms:</span>
                    <span className="font-medium">{totalRooms(deal.roomTypes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Purchase Price:</span>
                    <span className="font-medium">{eur0(deal.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium">{dateShort(deal.createdAt)}</span>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => handleOpen(deal.id)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(deal.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this deal? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}