import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Section } from '../components/ui/section';
import { listDeals, removeDeal, saveDeals } from '../lib/dealStore';
import { sampleDeals } from '../data/sampleDeals';
import { Deal } from '../types/deal';
import { totalRooms } from '../lib/rooms';
import { eur0, dateShort } from '../lib/format';
import { formatDate, formatRelativeTime } from '../lib/utils';
import SafeImage from '../components/SafeImage';
import { lastSavedLabel } from '../lib/utils';
import { seedSampleDeals } from '../lib/datasource';
import { useToast } from '../components/ui/toast';

export default function UnderwritingHome() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setDeals(listDeals());
  }, []);

  const handleLoadSamples = async () => {
    setLoadingSamples(true);
    try {
      const result = await seedSampleDeals();
      if (result.error) {
        toast.error(result.error);
      } else {
        // Also add to local storage for immediate UI update
        saveDeals([...listDeals(), ...sampleDeals]);
        setDeals(listDeals());
        toast.success(`${result.count} sample deals added to your account`);
      }
    } catch (error: any) {
      console.error('Failed to seed sample deals:', error);
      // Fallback to local storage only
      saveDeals(sampleDeals);
      setDeals(listDeals());
      toast.success('Sample deals loaded locally');
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleDelete = (id: string) => {
    removeDeal(id);
    setDeals(listDeals());
    setShowDeleteConfirm(null);
  };

  const handleOpen = (id: string) => {
    navigate(`/underwriting/${id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-slate-600">Manage your hotel underwriting projects</p>
        </div>
        <Link to="/underwriting/new">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Deal</span>
          </Button>
        </Link>
      </div>

      {deals.length === 0 ? (
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
          {deals.map((deal) => (
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