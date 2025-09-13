import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import type {
  StaffingAssumptions,
  StaffingOverrides,
  LinkedStaffingValues,
} from '../../lib/staffing/types';

// Types
type AssumptionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  yearIdx: number; // 0-based
  assumptions: StaffingAssumptions;
  onAssumptionsChange: (next: StaffingAssumptions) => void;
  overrides?: StaffingOverrides;
  onOverridesChange?: (next: StaffingOverrides) => void;
  linkedValues?: LinkedStaffingValues;
};

export default function AssumptionsDrawer({
  isOpen,
  onClose,
  dealId,
  yearIdx,
  assumptions,
  onAssumptionsChange,
  overrides = {},
  onOverridesChange = () => {},
  linkedValues,
}: AssumptionsDrawerProps) {
  const [localAssumptions, setLocalAssumptions] = useState<StaffingAssumptions>(assumptions);
  const [localOverrides, setLocalOverrides] = useState<StaffingOverrides>(overrides);

  // Sync with props when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalAssumptions(assumptions);
      setLocalOverrides(overrides);
    }
  }, [isOpen, assumptions, overrides]);

  const handleSave = () => {
    onAssumptionsChange(localAssumptions);
    onOverridesChange(localOverrides);
    onClose();
  };

  const handleCancel = () => {
    setLocalAssumptions(assumptions);
    setLocalOverrides(overrides);
    onClose();
  };

  const handleOverrideToggle = (section: string, field: string, enabled: boolean) => {
    if (enabled) {
      // Enable override - copy current value
      const currentValue = linkedValues ? getLinkedValue(section, field) : 0;
      setLocalOverrides(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof StaffingOverrides],
          [field]: currentValue
        }
      }));
    } else {
      // Disable override - remove from overrides
      setLocalOverrides(prev => {
        const newOverrides = { ...prev };
        if (newOverrides[section as keyof StaffingOverrides]) {
          const sectionOverrides = { ...newOverrides[section as keyof StaffingOverrides] };
          delete sectionOverrides[field as keyof typeof sectionOverrides];
          if (Object.keys(sectionOverrides).length === 0) {
            delete newOverrides[section as keyof StaffingOverrides];
          } else {
            newOverrides[section as keyof StaffingOverrides] = sectionOverrides;
          }
        }
        return newOverrides;
      });
    }
  };

  const getLinkedValue = (section: string, field: string): number => {
    if (!linkedValues) return 0;
    
    switch (section) {
      case 'breakfast':
      case 'lunch':
      case 'dinner':
      case 'bar':
        return field === 'coversPerDay' ? linkedValues[section as keyof LinkedStaffingValues] as number : 0;
      case 'spa':
        if (field === 'treatmentsPerDay') return linkedValues.spa.treatmentsPerDay;
        if (field === 'openHours') return linkedValues.spa.openHours;
        return 0;
      default:
        return 0;
    }
  };

  const isOverridden = (section: string, field: string): boolean => {
    const sectionOverrides = localOverrides[section as keyof StaffingOverrides];
    return !!(sectionOverrides && sectionOverrides[field as keyof typeof sectionOverrides] !== undefined);
  };

  const getDisplayValue = (section: string, field: string): number => {
    if (isOverridden(section, field)) {
      const sectionOverrides = localOverrides[section as keyof StaffingOverrides];
      return sectionOverrides?.[field as keyof typeof sectionOverrides] || 0;
    }
    return getLinkedValue(section, field);
  };

  const handleOverrideValueChange = (section: string, field: string, value: number) => {
    setLocalOverrides(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof StaffingOverrides],
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-xl border-l border-slate-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Staffing Assumptions</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Configure operational assumptions for staffing calculations
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* General Settings */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hours per Week
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.hoursPerWeek || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      hoursPerWeek: Number(e.target.value) || 40
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="20"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Utilization Factor
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={localAssumptions.utilizationFactor * 100 || ''}
                      onChange={(e) => setLocalAssumptions(prev => ({
                        ...prev,
                        utilizationFactor: (Number(e.target.value) || 80) / 100
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      min="50"
                      max="100"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Productive time after holidays, sick days, training
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* F&B Service Periods */}
          {['breakfast', 'lunch', 'dinner', 'bar'].map((period) => (
            <Card key={period} className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{period}</CardTitle>
                  {linkedValues && (
                    <div className="flex items-center space-x-2">
                      {!isOverridden(period, 'coversPerDay') ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Linked to Underwriting
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          Overridden here
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Covers per Day
                      </label>
                      {linkedValues && (
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isOverridden(period, 'coversPerDay')}
                              onChange={(e) => handleOverrideToggle(period, 'coversPerDay', e.target.checked)}
                              className="text-brand-600 focus:ring-brand-500 rounded"
                            />
                            <span className="text-xs text-slate-600">Override</span>
                          </label>
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={getDisplayValue(period, 'coversPerDay') || ''}
                      onChange={(e) => handleOverrideValueChange(period, 'coversPerDay', Number(e.target.value) || 0)}
                      disabled={!isOverridden(period, 'coversPerDay') && !!linkedValues}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                        !isOverridden(period, 'coversPerDay') && linkedValues ? 'bg-slate-100' : ''
                      }`}
                      min="0"
                    />
                    {linkedValues && !isOverridden(period, 'coversPerDay') && (
                      <p className="text-xs text-slate-500 mt-1">
                        From Underwriting: (Rooms sold/day × guests/room × capture %) + external customers
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Service Hours
                    </label>
                    <input
                      type="number"
                      value={localAssumptions[`${period}Hours` as keyof StaffingAssumptions] || ''}
                      onChange={(e) => setLocalAssumptions(prev => ({
                        ...prev,
                        [`${period}Hours`]: Number(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      min="0"
                      max="24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Spa/Wellness */}
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Spa/Wellness</CardTitle>
                {linkedValues && (
                  <div className="flex items-center space-x-2">
                    {!isOverridden('spa', 'treatmentsPerDay') ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Linked to Underwriting
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Overridden here
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Treatments per Day
                    </label>
                    {linkedValues && (
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isOverridden('spa', 'treatmentsPerDay')}
                            onChange={(e) => handleOverrideToggle('spa', 'treatmentsPerDay', e.target.checked)}
                            className="text-brand-600 focus:ring-brand-500 rounded"
                          />
                          <span className="text-xs text-slate-600">Override</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    value={getDisplayValue('spa', 'treatmentsPerDay') || ''}
                    onChange={(e) => handleOverrideValueChange('spa', 'treatmentsPerDay', Number(e.target.value) || 0)}
                    disabled={!isOverridden('spa', 'treatmentsPerDay') && !!linkedValues}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                      !isOverridden('spa', 'treatmentsPerDay') && linkedValues ? 'bg-slate-100' : ''
                    }`}
                    min="0"
                  />
                  {linkedValues && !isOverridden('spa', 'treatmentsPerDay') && (
                    <p className="text-xs text-slate-500 mt-1">
                      From Underwriting: Spa treatments per day setting
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Operating Hours
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.spaHours || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      spaHours: Number(e.target.value) || 10
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="0"
                    max="24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Housekeeping */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Housekeeping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rooms per Attendant
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.roomsPerAttendant || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      roomsPerAttendant: Number(e.target.value) || 15
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="5"
                    max="30"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Rooms one attendant can clean per 8-hour shift
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Shift Hours
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.housekeepingShiftHours || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      housekeepingShiftHours: Number(e.target.value) || 8
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="4"
                    max="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Front Office */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Front Office</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Day Posts
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.dayPosts || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      dayPosts: Number(e.target.value) || 1
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Night Posts
                  </label>
                  <input
                    type="number"
                    value={localAssumptions.nightPosts || ''}
                    onChange={(e) => setLocalAssumptions(prev => ({
                      ...prev,
                      nightPosts: Number(e.target.value) || 1
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="0"
                    max="3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white">
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {linkedValues && (
              <Button
                variant="ghost"
                onClick={() => {
                  setLocalOverrides({});
                  // Reset to linked values
                }}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Underwriting</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}