import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link, Paperclip, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { useToast } from '../../../components/ui/toast';
import { useRoadmapStore } from '../store';
import { RoadmapStep, StepStatus } from '../types';

export default function StepInspectorDrawer() {
  const { toast } = useToast();
  const { 
    selectedStepId, 
    setSelectedStep, 
    steps, 
    chapters, 
    upsertStep 
  } = useRoadmapStore();

  const [editingStep, setEditingStep] = useState<RoadmapStep | null>(null);
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [newFile, setNewFile] = useState('');

  const selectedStep = steps.find(s => s.id === selectedStepId);

  useEffect(() => {
    if (selectedStep) {
      setEditingStep({ ...selectedStep });
    } else {
      setEditingStep(null);
    }
  }, [selectedStep]);

  const handleSave = () => {
    if (!editingStep) return;
    
    if (!editingStep.title.trim()) {
      toast.error('Step title is required');
      return;
    }
    
    upsertStep(editingStep);
    toast.success('Step saved');
  };

  const handleAddLink = () => {
    if (!editingStep || !newLink.label.trim() || !newLink.url.trim()) return;
    
    const updatedStep = {
      ...editingStep,
      externalLinks: [...(editingStep.externalLinks || []), { ...newLink }]
    };
    
    setEditingStep(updatedStep);
    setNewLink({ label: '', url: '' });
  };

  const handleRemoveLink = (index: number) => {
    if (!editingStep) return;
    
    const updatedStep = {
      ...editingStep,
      externalLinks: editingStep.externalLinks?.filter((_, i) => i !== index) || []
    };
    
    setEditingStep(updatedStep);
  };

  const handleAddFile = () => {
    if (!editingStep || !newFile.trim()) return;
    
    const updatedStep = {
      ...editingStep,
      files: [...(editingStep.files || []), { 
        name: newFile.trim(), 
        placeholderId: crypto.randomUUID() 
      }]
    };
    
    setEditingStep(updatedStep);
    setNewFile('');
  };

  const handleRemoveFile = (index: number) => {
    if (!editingStep) return;
    
    const updatedStep = {
      ...editingStep,
      files: editingStep.files?.filter((_, i) => i !== index) || []
    };
    
    setEditingStep(updatedStep);
  };

  const handleDependencyToggle = (stepId: string, checked: boolean) => {
    if (!editingStep) return;
    
    let newDependencies = [...editingStep.dependsOnIds];
    
    if (checked) {
      if (!newDependencies.includes(stepId)) {
        newDependencies.push(stepId);
      }
    } else {
      newDependencies = newDependencies.filter(id => id !== stepId);
    }
    
    setEditingStep({
      ...editingStep,
      dependsOnIds: newDependencies
    });
  };

  const availableDependencies = steps.filter(s => 
    s.id !== editingStep?.id && 
    s.chapterId !== editingStep?.chapterId // Can't depend on steps in same chapter for simplicity
  );

  if (!selectedStepId || !editingStep) {
    return (
      <div className="w-96 bg-slate-50 border-l border-slate-200 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-4">📋</div>
          <p>Select a step to edit details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-slate-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Step Inspector</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStep(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <Input
              value={editingStep.title}
              onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
              placeholder="Enter step title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <Textarea
              value={editingStep.description || ''}
              onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
              placeholder="Enter step description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner
              </label>
              <Input
                value={editingStep.owner || ''}
                onChange={(e) => setEditingStep({ ...editingStep, owner: e.target.value })}
                placeholder="e.g., PM, Architect"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <Select 
                value={editingStep.type || ''} 
                onValueChange={(value) => setEditingStep({ ...editingStep, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permits">Permits</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Financing">Financing</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status & Progress */}
        {/* Structural Flags */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Milestone</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-slate-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Mark as a key milestone in the project timeline
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={editingStep.milestone || false}
              onCheckedChange={(checked) => setEditingStep({ ...editingStep, milestone: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Critical Path</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-slate-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Computed automatically based on longest path through dependencies
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant={editingStep.critical ? 'destructive' : 'secondary'}>
              {editingStep.critical ? 'Critical' : 'Non-Critical'}
            </Badge>
          </div>
          
          <div className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded p-3">
            <strong>Note:</strong> Status, Progress %, and Due Dates are managed by users per deal, not in this admin interface.
          </div>
        </div>

        {/* Dependencies */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Dependencies
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableDependencies.map((step) => (
              <div key={step.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingStep.dependsOnIds.includes(step.id)}
                  onChange={(e) => handleDependencyToggle(step.id, e.target.checked)}
                  className="text-brand-600 focus:ring-brand-500 rounded"
                />
                <span className="text-sm text-slate-700 flex-1 truncate">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          {availableDependencies.length === 0 && (
            <p className="text-sm text-slate-500 italic">No available dependencies</p>
          )}
        </div>

        {/* External Links */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            External Links
          </label>
          
          <div className="space-y-2">
            {editingStep.externalLinks?.map((link, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                <Link className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{link.label}</div>
                  <div className="text-xs text-slate-500 truncate">{link.url}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <Input
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="Link label"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              disabled={!newLink.label.trim() || !newLink.url.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>

        {/* Files */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Files (Placeholders)
          </label>
          
          <div className="space-y-2">
            {editingStep.files?.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-900 flex-1">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <Input
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
              placeholder="File name (e.g., Contract_v1.pdf)"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFile}
              disabled={!newFile.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add File Placeholder
            </Button>
          </div>
          
          <div className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded p-2">
            <strong>Note:</strong> File upload will be available with Supabase storage integration
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200">
          <Button
            onClick={handleSave}
            className="w-full bg-brand-600 hover:bg-brand-700"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}