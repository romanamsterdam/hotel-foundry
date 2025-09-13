import React, { useState } from 'react';
import { Play, Save, Plus, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/toast';
import { useBenchmarksStore } from '../store';
import { BenchmarkSet } from '../types';

export default function BenchmarksTopBar() {
  const { toast } = useToast();
  const sets = useBenchmarksStore(s => s.sets);
  const currentSetId = useBenchmarksStore(s => s.currentSetId);
  const setCurrentSet = useBenchmarksStore(s => s.setCurrentSet);
  const upsertSet = useBenchmarksStore(s => s.upsertSet);
  const publish = useBenchmarksStore(s => s.publish);

  const [showNewSetDialog, setShowNewSetDialog] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetNotes, setNewSetNotes] = useState('');

  const currentSet = sets.find(s => s.id === currentSetId);

  const handlePublish = () => {
    if (!currentSetId) return;
    
    try {
      publish();
      toast.success(`Published v${(currentSet?.version || 0) + 1}`);
    } catch (error) {
      toast.error('Failed to publish benchmark set');
    }
  };

  const handleCreateSet = () => {
    if (!newSetTitle.trim()) {
      toast.error('Set title is required');
      return;
    }

    const newSet: BenchmarkSet = {
      id: crypto.randomUUID(),
      title: newSetTitle.trim(),
      status: 'draft',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: newSetNotes.trim() || undefined
    };

    upsertSet(newSet);
    setCurrentSet(newSet.id);
    setShowNewSetDialog(false);
    setNewSetTitle('');
    setNewSetNotes('');
    toast.success('Benchmark set created');
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Benchmark Set:</span>
            <Select value={currentSetId || ''} onValueChange={setCurrentSet}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select benchmark set" />
              </SelectTrigger>
              <SelectContent>
                {sets.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.title} (v{set.version} • {set.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentSet && (
            <Badge variant={currentSet.status === 'published' ? 'default' : 'secondary'}>
              v{currentSet.version} • {currentSet.status}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewSetDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Set</span>
          </Button>
          
          <Button
            onClick={handlePublish}
            disabled={!currentSetId}
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700"
          >
            <Play className="h-4 w-4" />
            <span>Publish</span>
          </Button>
        </div>
      </div>

      {/* New Set Dialog */}
      <Dialog open={showNewSetDialog} onOpenChange={setShowNewSetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Benchmark Set</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <Input
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                placeholder="e.g., EU Markets 2025 Q1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <Textarea
                value={newSetNotes}
                onChange={(e) => setNewSetNotes(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSet}>
              Create Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}