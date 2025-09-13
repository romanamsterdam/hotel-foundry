import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/toast';
import { useRoadmapStore } from '../store';
import { RoadmapChapter } from '../types';

export default function ChapterSidebar() {
  const { toast } = useToast();
  const { 
    currentProjectId, 
    chapters, 
    steps, 
    upsertChapter, 
    deleteChapter 
  } = useRoadmapStore();

  const [editingChapter, setEditingChapter] = useState<RoadmapChapter | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const handleAddChapter = () => {
    if (!currentProjectId) return;
    
    const newChapter: RoadmapChapter = {
      id: crypto.randomUUID(),
      projectId: currentProjectId,
      order: chapters.length + 1,
      title: '',
      description: ''
    };
    
    setEditingChapter(newChapter);
    setShowDialog(true);
  };

  const handleEditChapter = (chapter: RoadmapChapter) => {
    setEditingChapter({ ...chapter });
    setShowDialog(true);
  };

  const handleSaveChapter = () => {
    if (!editingChapter) return;
    
    if (!editingChapter.title.trim()) {
      toast.error('Chapter title is required');
      return;
    }
    
    upsertChapter(editingChapter);
    setShowDialog(false);
    setEditingChapter(null);
    toast.success('Chapter saved');
  };

  const handleDeleteChapter = (chapter: RoadmapChapter) => {
    const chapterSteps = steps.filter(s => s.chapterId === chapter.id);
    
    if (chapterSteps.length > 0) {
      if (!confirm(`Delete "${chapter.title}" and its ${chapterSteps.length} steps? This cannot be undone.`)) {
        return;
      }
    }
    
    deleteChapter(chapter.id);
    toast.success('Chapter deleted');
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getChapterStats = (chapterId: string) => {
    const chapterSteps = steps.filter(s => s.chapterId === chapterId);
    const doneSteps = chapterSteps.filter(s => s.status === 'done');
    const criticalSteps = chapterSteps.filter(s => s.critical);
    
    return {
      total: chapterSteps.length,
      done: doneSteps.length,
      critical: criticalSteps.length,
      progress: chapterSteps.length > 0 ? (doneSteps.length / chapterSteps.length) * 100 : 0
    };
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Chapters</h2>
          <Button
            size="sm"
            onClick={handleAddChapter}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {chapters.map((chapter) => {
          const stats = getChapterStats(chapter.id);
          const isExpanded = expandedChapters.has(chapter.id);
          const chapterSteps = steps.filter(s => s.chapterId === chapter.id);
          
          return (
            <Card key={chapter.id} className="border-slate-200">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex items-center space-x-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-sm">{chapter.title}</CardTitle>
                      <div className="text-xs text-slate-500 mt-1">
                        {stats.total} steps • {stats.done} done • {stats.critical} critical
                      </div>
                    </div>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditChapter(chapter)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChapter(chapter)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1">
                    {chapterSteps.slice(0, 5).map((step) => (
                      <div key={step.id} className="flex items-center space-x-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          step.status === 'done' ? 'bg-green-500' :
                          step.status === 'in_progress' ? 'bg-blue-500' :
                          step.status === 'blocked' ? 'bg-red-500' :
                          'bg-slate-300'
                        }`} />
                        <span className={`flex-1 truncate ${step.critical ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                          {step.title}
                        </span>
                        {step.milestone && <span className="text-yellow-500">★</span>}
                      </div>
                    ))}
                    {chapterSteps.length > 5 && (
                      <div className="text-xs text-slate-400">
                        +{chapterSteps.length - 5} more steps
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Chapter Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingChapter?.title ? 'Edit Chapter' : 'Add Chapter'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <Input
                value={editingChapter?.title || ''}
                onChange={(e) => setEditingChapter(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Enter chapter title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <Textarea
                value={editingChapter?.description || ''}
                onChange={(e) => setEditingChapter(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter chapter description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChapter}>
              Save Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}