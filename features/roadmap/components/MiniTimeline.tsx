import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { useRoadmapStore } from '../store';

export default function MiniTimeline() {
  const { steps, chapters } = useRoadmapStore();
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  const filteredSteps = showCriticalOnly ? steps.filter(s => s.critical) : steps;

  // Build timeline data
  const timelineData = filteredSteps.map((step, index) => {
    const chapter = chapters.find(c => c.id === step.chapterId);
    const duration = step.durationDays || 1;
    
    return {
      name: step.title.length > 20 ? step.title.substring(0, 20) + '...' : step.title,
      duration,
      chapter: chapter?.title || 'Unknown',
      status: step.status,
      critical: step.critical,
      milestone: step.milestone,
      order: index
    };
  });

  const getBarColor = (status: string, critical: boolean) => {
    if (critical) return '#ef4444'; // red for critical
    
    switch (status) {
      case 'done': return '#10b981'; // green
      case 'in_progress': return '#3b82f6'; // blue
      case 'blocked': return '#f59e0b'; // amber
      default: return '#94a3b8'; // slate
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-slate-900">{data.name}</p>
        <p className="text-sm text-slate-600">Chapter: {data.chapter}</p>
        <p className="text-sm text-slate-600">Duration: {data.duration} days</p>
        <p className="text-sm text-slate-600">Status: {data.status}</p>
        {data.critical && (
          <Badge variant="destructive" className="mt-1">Critical Path</Badge>
        )}
        {data.milestone && (
          <Badge className="mt-1 bg-yellow-100 text-yellow-700">Milestone</Badge>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Project Timeline</h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Critical only:</span>
          <Switch
            checked={showCriticalOnly}
            onCheckedChange={setShowCriticalOnly}
          />
        </div>
      </div>

      {timelineData.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No steps to display</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Duration (Days)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="duration" 
                fill={(entry: any) => getBarColor(entry.status, entry.critical)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-slate-400 rounded"></div>
          <span>Not Started</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Done</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Critical Path</span>
        </div>
      </div>
    </div>
  );
}