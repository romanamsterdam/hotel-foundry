import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import { FacilityTag } from '../../types/property';
import { facilityLabel, facilityKey } from '../../lib/deals/normalizers';

const availableFacilities: FacilityTag[] = [
  'Pool', 'Restaurant', 'Bar', 'Spa', 'Parking', 'Gym', 'Beach', 'Conference', 'RoomService', 'Other'
];

interface FacilitiesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: FacilityTag[];
  onSave: (facilities: FacilityTag[]) => void;
}

export default function FacilitiesEditor({ isOpen, onClose, facilities, onSave }: FacilitiesEditorProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<FacilityTag[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFacilities([...facilities]);
    }
  }, [isOpen, facilities]);

  const handleToggleFacility = (facility: FacilityTag) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleSave = () => {
    onSave(selectedFacilities);
  };

  const handleCancel = () => {
    setSelectedFacilities([...facilities]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Facilities</DialogTitle>
          <p className="text-sm text-slate-600">
            Select which facilities your property includes.
          </p>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableFacilities.map((facility) => {
              const isSelected = selectedFacilities.includes(facility);
              
              return (
                <button
                  key={facility}
                  onClick={() => handleToggleFacility(facility)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{facilityLabel(facility)}</span>
                    {isSelected && (
                      <div className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Facilities Preview */}
          {selectedFacilities.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Selected Facilities ({selectedFacilities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedFacilities.map((facility) => (
                  <Badge
                    key={facilityKey(facility)}
                    variant="secondary"
                    className="bg-brand-100 text-brand-700 flex items-center space-x-1"
                  >
                    <span>{facilityLabel(facility)}</span>
                    <button
                      onClick={() => handleToggleFacility(facility)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white">
            Save Facilities
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}