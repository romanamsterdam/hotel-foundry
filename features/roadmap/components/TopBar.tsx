import React from 'react';
import { Play, Save, Eye, Calculator } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../components/ui/toast';
import { useRoadmapStore } from '../store';

export default function TopBar() {
  const { toast } = useToast();
  const projects = useRoadmapStore(s => s.projects);
  const currentProjectId = useRoadmapStore(s => s.currentProjectId);
  const setCurrentProject = useRoadmapStore(s => s.setCurrentProject);
  const publish = useRoadmapStore(s => s.publish);
  const recomputeCritical = useRoadmapStore(s => s.recomputeCritical);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handlePublish = () => {
    if (!currentProjectId) return;
    
    try {
      if (typeof publish === 'function') {
        publish();
        toast.success(`Published v${(currentProject?.version || 0) + 1}`);
      }
    } catch (error) {
      toast.error('Failed to publish roadmap');
    }
  };

  const handleRecompute = () => {
    try {
      if (typeof recomputeCritical === 'function') {
        recomputeCritical();
        toast.success('Critical path recomputed');
      }
    } catch (error) {
      toast.error('Failed to recompute critical path');
    }
  };

  const handlePreviewAsUser = () => {
    window.open('/roadmap', '_blank', 'noopener,noreferrer');
  };

  const handleProjectChange = (projectId: string) => {
    if (typeof setCurrentProject === 'function') {
      setCurrentProject(projectId);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Project:</span>
          <Select value={currentProjectId || ''} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {currentProject && (
          <div className="flex items-center space-x-2">
            <Badge variant={currentProject.status === 'published' ? 'default' : 'secondary'}>
              v{currentProject.version} • {currentProject.status}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecompute}
          className="flex items-center space-x-2"
        >
          <Calculator className="h-4 w-4" />
          <span>Recompute Critical Path</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewAsUser}
          className="flex items-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Preview as User</span>
        </Button>
        
        <Button
          onClick={handlePublish}
          disabled={!currentProjectId}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700"
        >
          <Play className="h-4 w-4" />
          <span>Publish</span>
        </Button>
      </div>
    </div>
  );
}