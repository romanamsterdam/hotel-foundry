import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { loadProgress } from '../../lib/uwProgress';
import { underwritingSteps } from '../../data/underwritingSteps';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  section?: string;
}

interface ChecklistNextActionsProps {
  dealId: string;
  staffingGap: number;
  contingencyPct: number;
  gopPct: number;
  dscr: number;
}

export default function ChecklistNextActions({ 
  dealId, 
  staffingGap, 
  contingencyPct, 
  gopPct, 
  dscr 
}: ChecklistNextActionsProps) {
  const navigate = useNavigate();
  const progress = loadProgress(dealId);

  // Build checklist items
  const getChecklistItems = (): ChecklistItem[] => {
    const items: ChecklistItem[] = [];

    // Core underwriting steps
    underwritingSteps.forEach(step => {
      items.push({
        id: step.id,
        label: step.title,
        completed: !!progress[step.id]?.completed,
        priority: 'medium',
        section: step.id
      });
    });

    // Dynamic action items based on analysis
    if (staffingGap >= 0.5) {
      items.push({
        id: 'staffing-gap',
        label: `Address critical staffing shortfall (${staffingGap.toFixed(1)} FTE)`,
        completed: false,
        priority: 'high',
        action: 'Review staffing plan and hiring requirements',
        section: 'payrollModel'
      });
    }

    if (contingencyPct < 0.05) {
      items.push({
        id: 'contingency-low',
        label: 'Increase contingency to at least 5%',
        completed: false,
        priority: 'high',
        action: 'Add budget buffer for unexpected costs',
        section: 'investmentBudget'
      });
    }

    if (gopPct < 0.20) {
      items.push({
        id: 'gop-low',
        label: 'Review cost structure (GOP margin below 20%)',
        completed: false,
        priority: 'high',
        action: 'Validate operating cost assumptions',
        section: 'operatingCosts'
      });
    }

    if (dscr > 0 && dscr < 1.20) {
      items.push({
        id: 'dscr-low',
        label: 'Improve debt service coverage (DSCR below 1.20x)',
        completed: false,
        priority: 'high',
        action: 'Reduce debt or improve operating projections',
        section: 'financingStructure'
      });
    }

    // Market validation items
    items.push({
      id: 'market-validation',
      label: 'Validate ADR vs local competitors',
      completed: false,
      priority: 'medium',
      action: 'Research comparable properties in the area'
    });

    items.push({
      id: 'exit-validation',
      label: 'Confirm exit cap rate assumptions',
      completed: false,
      priority: 'medium',
      action: 'Review recent hotel transactions in the market',
      section: 'exitStrategy'
    });

    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const checklist = getChecklistItems();
  const completedCount = checklist.filter(item => item.completed).length;
  const highPriorityIncomplete = checklist.filter(item => !item.completed && item.priority === 'high');

  const handleJumpToSection = (sectionId?: string) => {
    if (sectionId) {
      navigate(`/underwriting/${dealId}`, { state: { activeSection: sectionId } });
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Checklist & Next Actions</CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {completedCount} of {checklist.length} complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Priority Items */}
        {highPriorityIncomplete.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center space-x-2">
              <span>High Priority Actions</span>
              <Badge className="bg-red-100 text-red-700">{highPriorityIncomplete.length}</Badge>
            </h4>
            <div className="space-y-2">
              {highPriorityIncomplete.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Circle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-sm font-medium text-red-900">{item.label}</div>
                      {item.action && (
                        <div className="text-xs text-red-700">{item.action}</div>
                      )}
                    </div>
                  </div>
                  {item.section && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJumpToSection(item.section)}
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Items */}
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">All Items</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                <div className="flex items-center space-x-3">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <div className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {item.label}
                    </div>
                    {item.action && !item.completed && (
                      <div className="text-xs text-slate-600">{item.action}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                  {item.section && !item.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToSection(item.section)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Overall Progress</span>
            <span className="text-sm font-medium text-slate-900">
              {Math.round((completedCount / checklist.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / checklist.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}