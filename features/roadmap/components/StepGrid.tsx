import React, { useState } from 'react';
import { Plus, Edit, Copy, Trash2, Star, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../components/ui/toast';
import { useRoadmapStore } from '../store';
import { RoadmapStep, StepStatus } from '../types';

export default function StepGrid() {
  const { toast } = useToast();
  const { 
    currentProjectId, 
    chapters, 
    steps, 
    upsertStep, 
    deleteStep,
    setSelectedStep 
  } = useRoadmapStore();

  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

  const filteredSteps = selectedChapterId === 'all' 
    ? steps 
    : steps.filter(s => s.chapterId === selectedChapterId);

  const getChapterTitle = (chapterId: string) => {
    return chapters.find(c => c.id === chapterId)?.title || 'Unknown Chapter';
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-green-100 text-green-700">Done</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const handleQuickAdd = () => {
    if (!currentProjectId) return;
    
    const firstChapter = chapters[0];
    if (!firstChapter) {
      toast.error('Add a chapter first');
      return;
    }
    
    const chapterSteps = steps.filter(s => s.chapterId === firstChapter.id);
    const newStep: RoadmapStep = {
      id: crypto.randomUUID(),
      projectId: currentProjectId,
      chapterId: firstChapter.id,
      order: chapterSteps.length + 1,
      title: 'New Step',
      status: 'not_started',
      dependsOnIds: [],
      milestone: false,
      critical: false
    };
    
    upsertStep(newStep);
    setSelectedStep(newStep.id);
    toast.success('Step added');
  };

  const handleDuplicateStep = (step: RoadmapStep) => {
    const duplicated: RoadmapStep = {
      ...step,
      id: crypto.randomUUID(),
      title: `${step.title} (copy)`,
      order: step.order + 1,
      dependsOnIds: []
    };
    
    upsertStep(duplicated);
    toast.success('Step duplicated');
  };

  const handleDeleteStep = (step: RoadmapStep) => {
    if (!confirm(`Delete "${step.title}"? This cannot be undone.`)) return;
    
    deleteStep(step.id);
    toast.success('Step deleted');
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-slate-900">Development Steps</h2>
          
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleQuickAdd}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Step</span>
        </Button>
      </div>

      {filteredSteps.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No steps yet</h3>
          <p className="text-slate-600 mb-6">Start by adding your first development step</p>
          <Button onClick={handleQuickAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Step
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Order</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Title</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Chapter</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Owner</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Flags</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSteps.map((step) => (
                <tr 
                  key={step.id} 
                  className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                    step.critical ? 'bg-red-50/50' : ''
                  }`}
                  onClick={() => setSelectedStep(step.id)}
                >
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {step.order}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{step.title}</div>
                    {step.description && (
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {step.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {getChapterTitle(step.chapterId)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {step.owner || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {step.milestone && <Star className="h-4 w-4 text-yellow-500" />}
                      {step.critical && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStep(step.id);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateStep(step);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(step);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}