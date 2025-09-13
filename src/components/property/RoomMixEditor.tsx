import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { RoomType } from '../../types/property';

interface RoomMixEditorProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: RoomType[];
  onSave: (roomTypes: RoomType[]) => void;
}

export default function RoomMixEditor({ isOpen, onClose, roomTypes, onSave }: RoomMixEditorProps) {
  const [localRoomTypes, setLocalRoomTypes] = useState<RoomType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setLocalRoomTypes([...roomTypes]);
      setErrors({});
    }
  }, [isOpen, roomTypes]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const totalRooms = localRoomTypes.reduce((sum, rt) => sum + rt.count, 0);
    if (totalRooms === 0) {
      newErrors.total = "Total rooms must be greater than 0";
    }

    localRoomTypes.forEach((rt, index) => {
      if (!rt.name.trim()) {
        newErrors[`name-${index}`] = "Room type name is required";
      }
      if (rt.count < 0) {
        newErrors[`count-${index}`] = "Room count cannot be negative";
      }
      if (rt.baseAdr && rt.baseAdr <= 0) {
        newErrors[`adr-${index}`] = "Base ADR must be positive";
      }
      if (rt.baseOcc && (rt.baseOcc < 0 || rt.baseOcc > 1)) {
        newErrors[`occ-${index}`] = "Base occupancy must be between 0 and 1";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddRoomType = () => {
    if (localRoomTypes.length >= 5) return;
    
    setLocalRoomTypes([
      ...localRoomTypes,
      {
        id: crypto.randomUUID(),
        name: '',
        count: 0,
        baseAdr: undefined,
        baseOcc: undefined
      }
    ]);
  };

  const handleRemoveRoomType = (index: number) => {
    if (localRoomTypes.length <= 1) return;
    setLocalRoomTypes(localRoomTypes.filter((_, i) => i !== index));
  };

  const handleRoomTypeChange = (index: number, field: keyof RoomType, value: string | number) => {
    const updated = [...localRoomTypes];
    updated[index] = { ...updated[index], [field]: value };
    setLocalRoomTypes(updated);
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave(localRoomTypes.filter(rt => rt.name.trim()));
  };

  const totalRooms = localRoomTypes.reduce((sum, rt) => sum + rt.count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Room Mix</DialogTitle>
          <p className="text-sm text-slate-600">
            Configure room types, counts, and optional base pricing assumptions.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {localRoomTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No room types configured yet.</p>
              <Button onClick={handleAddRoomType} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Room Type
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                <div className="col-span-3">Room Type Name</div>
                <div className="col-span-2">Count</div>
                <div className="col-span-3 flex items-center gap-1">
                  <span>Base ADR (€)</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-400 hover:text-slate-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        Optional seed ADR for this room type. Used as starting point in revenue modeling.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <span>Base Occupancy</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-400 hover:text-slate-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        Optional seed occupancy (0.0-1.0). Used as starting point in revenue modeling.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Room Type Rows */}
              {localRoomTypes.map((roomType, index) => (
                <div key={roomType.id} className="space-y-3 md:space-y-0">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3 p-4 border border-slate-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Room Type Name
                      </label>
                      <input
                        type="text"
                        value={roomType.name}
                        onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`name-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., Standard"
                      />
                      {errors[`name-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`name-${index}`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Count
                        </label>
                        <input
                          type="number"
                          value={roomType.count || ''}
                          onChange={(e) => handleRoomTypeChange(index, 'count', Number(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                            errors[`count-${index}`] ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="0"
                          min="0"
                        />
                        {errors[`count-${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`count-${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Base ADR (€)
                        </label>
                        <input
                          type="number"
                          value={roomType.baseAdr || ''}
                          onChange={(e) => handleRoomTypeChange(index, 'baseAdr', Number(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                            errors[`adr-${index}`] ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Optional"
                          min="0"
                        />
                        {errors[`adr-${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`adr-${index}`]}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Base Occupancy (0.0-1.0)
                      </label>
                      <input
                        type="number"
                        value={roomType.baseOcc || ''}
                        onChange={(e) => handleRoomTypeChange(index, 'baseOcc', Number(e.target.value) || undefined)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`occ-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="Optional (e.g., 0.75)"
                        min="0"
                        max="1"
                        step="0.01"
                      />
                      {errors[`occ-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`occ-${index}`]}</p>
                      )}
                    </div>

                    {localRoomTypes.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRoomType(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Grid */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-start">
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={roomType.name}
                        onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`name-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., Standard"
                      />
                      {errors[`name-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`name-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        value={roomType.count || ''}
                        onChange={(e) => handleRoomTypeChange(index, 'count', Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`count-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors[`count-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`count-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={roomType.baseAdr || ''}
                        onChange={(e) => handleRoomTypeChange(index, 'baseAdr', Number(e.target.value) || undefined)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`adr-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="Optional"
                        min="0"
                      />
                      {errors[`adr-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`adr-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={roomType.baseOcc || ''}
                        onChange={(e) => handleRoomTypeChange(index, 'baseOcc', Number(e.target.value) || undefined)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`occ-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="Optional (0.0-1.0)"
                        min="0"
                        max="1"
                        step="0.01"
                      />
                      {errors[`occ-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`occ-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-1">
                      {localRoomTypes.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRoomType(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Room Type Button */}
              {localRoomTypes.length < 5 && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={handleAddRoomType}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Room Type</span>
                  </Button>
                </div>
              )}

              {/* Total Summary */}
              <div className="border-t border-slate-200 pt-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    Total Rooms: <span className="text-lg font-semibold text-slate-900">{totalRooms}</span>
                  </div>
                  {errors.total && (
                    <p className="text-sm text-red-600">{errors.total}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}