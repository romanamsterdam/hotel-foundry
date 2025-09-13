import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useRoadmapStore } from '../../features/roadmap/store';
import TopBar from '../../features/roadmap/components/TopBar';
import ChapterSidebar from '../../features/roadmap/components/ChapterSidebar';
import StepGrid from '../../features/roadmap/components/StepGrid';
import StepInspectorDrawer from '../../features/roadmap/components/StepInspectorDrawer';
import MiniTimeline from '../../features/roadmap/components/MiniTimeline';

export default function AdminRoadmapPage() {
  const currentProjectId = useRoadmapStore(s => s.currentProjectId);
  const ensureProjectSelected = useRoadmapStore(s => s.ensureProjectSelected);
  const refresh = useRoadmapStore(s => s.refresh);

  useEffect(() => {
    // Initialize store on mount
    if (typeof ensureProjectSelected === 'function') {
      ensureProjectSelected();
    }
    
    if (currentProjectId && typeof refresh === 'function') {
      refresh();
    }
  }, [currentProjectId, ensureProjectSelected, refresh]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing
      }
      
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        // Add step shortcut
        e.preventDefault();
        // TODO: Trigger add step
      }
      
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        // Add chapter shortcut
        e.preventDefault();
        // TODO: Trigger add chapter
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentProjectId) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Project Selected</h2>
          <p className="text-slate-600 mb-6">Select a project from the top bar to get started.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Roadmap Structure Manager</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Manage chapters, steps, and dependencies. Users track their own progress per deal.
              </p>
            </div>
            <TopBar />
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6">
        <ChapterSidebar />
        
        <div className="min-w-0">
          <StepGrid />
        </div>
        
        <StepInspectorDrawer />
      </div>
    </div>
  );
}