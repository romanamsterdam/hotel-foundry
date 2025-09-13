import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from './ui/toast';

type Facilities = {
  restaurant: boolean;
  bar: boolean;
  roomService: boolean;
  spa: boolean;
  parking: boolean;
  meetingEvents: boolean;
  pool: boolean;
};

interface FacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facilities;
  onSave: (facilities: Facilities) => void;
  hasRevenueConflicts?: {
    restaurant?: boolean;
    bar?: boolean;
    spa?: boolean;
  };
  facilitiesArray?: string[]; // New normalized format
  onSaveArray?: (facilities: string[]) => void; // New save handler
}

const facilityConfig = [
  {
    key: 'restaurant' as keyof Facilities,
    label: 'Restaurant',
    helper: 'Enables Breakfast/Lunch/Dinner in F&B Revenue.'
  },
  {
    key: 'bar' as keyof Facilities,
    label: 'Bar',
    helper: 'Enables Bar in F&B Revenue.'
  },
  {
    key: 'roomService' as keyof Facilities,
    label: 'Room Service',
    helper: ''
  },
  {
    key: 'spa' as keyof Facilities,
    label: 'Spa',
    helper: 'Enables Spa in Other Revenue.'
  },
  {
    key: 'parking' as keyof Facilities,
    label: 'Parking',
    helper: 'Referenced in Other Revenue checks.'
  },
  {
    key: 'meetingEvents' as keyof Facilities,
    label: 'Meeting & Events',
    helper: 'Referenced in Other Revenue checks.'
  },
  {
    key: 'pool' as keyof Facilities,
    label: 'Pool',
    helper: ''
  }
];

export default function FacilitiesModal({ 
  isOpen, 
  onClose, 
  facilities, 
  onSave, 
  hasRevenueConflicts = {},
  facilitiesArray,
  onSaveArray
}: FacilitiesModalProps) {
  const { toast } = useToast();
  const [localFacilities, setLocalFacilities] = useState<Facilities>(facilities);
  const [localFacilitiesArray, setLocalFacilitiesArray] = useState<string[]>(facilitiesArray || []);

  useEffect(() => {
    if (isOpen) {
      if (facilitiesArray && onSaveArray) {
        setLocalFacilitiesArray([...facilitiesArray]);
      } else {
        setLocalFacilities(facilities);
      }
    }
  }, [isOpen, facilities, facilitiesArray]);

  const handleToggle = (key: keyof Facilities) => {
    setLocalFacilities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    if (facilitiesArray && onSaveArray) {
      onSaveArray(localFacilitiesArray);
    } else {
      onSave(localFacilities);
    }
    toast.success("Facilities updated");
    onClose();
  };

  const handleCancel = () => {
    if (facilitiesArray && onSaveArray) {
      setLocalFacilitiesArray([...facilitiesArray]);
    } else {
      setLocalFacilities(facilities);
    }
    onClose();
  };

  // Check for conflicts when disabling facilities
  const getConflictWarnings = () => {
    const warnings = [];
    
    const hasRestaurant = facilitiesArray && onSaveArray ? 
      localFacilitiesArray.includes('Restaurant') : 
      localFacilities.restaurant;
    
    const hasBar = facilitiesArray && onSaveArray ? 
      localFacilitiesArray.includes('Bar') : 
      localFacilities.bar;
    
    const hasSpa = facilitiesArray && onSaveArray ? 
      localFacilitiesArray.includes('Spa') : 
      localFacilities.spa;
    
    if (!hasRestaurant && hasRevenueConflicts.restaurant) {
      warnings.push("You've turned off Restaurant while F&B meal revenue is entered. You can keep the inputs, but we'll flag a warning on the F&B page.");
    }
    
    if (!hasBar && hasRevenueConflicts.bar) {
      warnings.push("You've turned off Bar while Bar revenue is entered. You can keep the inputs, but we'll flag a warning on the F&B page.");
    }
    
    if (!hasSpa && hasRevenueConflicts.spa) {
      warnings.push("You've turned off Spa while Spa revenue is entered. You can keep the inputs, but we'll flag a warning on the Other Revenue page.");
    }
    
    return warnings;
  };

  const conflictWarnings = getConflictWarnings();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Facilities</DialogTitle>
          <p className="text-sm text-slate-600">
            Configure which facilities your hotel property includes.
          </p>
        </DialogHeader>

        <div className="py-6">
          {/* Conflict Warnings */}
          {conflictWarnings.length > 0 && (
            <div className="mb-6 space-y-3">
              {conflictWarnings.map((warning, index) => (
                <div key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-sm font-medium">
                      {warning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Facilities Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Column A */}
            <div className="space-y-4">
              {facilityConfig.slice(0, 4).map((facility) => (
                <div key={facility.key}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facilitiesArray && onSaveArray ? 
                        localFacilitiesArray.includes(facility.label) :
                        localFacilities[facility.key]
                      }
                      onChange={() => {
                        if (facilitiesArray && onSaveArray) {
                          if (localFacilitiesArray.includes(facility.label)) {
                            setLocalFacilitiesArray(prev => prev.filter(f => f !== facility.label));
                          } else {
                            setLocalFacilitiesArray(prev => [...prev, facility.label]);
                          }
                        } else {
                          handleToggle(facility.key);
                        }
                      }}
                      className="text-brand-600 focus:ring-brand-500 rounded"
                      aria-describedby={facility.helper ? `${facility.key}-helper` : undefined}
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900">
                        {facility.label}
                      </span>
                      {facility.helper && (
                        <p 
                          id={`${facility.key}-helper`}
                          className="text-xs text-slate-500 mt-0.5"
                        >
                          {facility.helper}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {/* Column B */}
            <div className="space-y-4">
              {facilityConfig.slice(4).map((facility) => (
                <div key={facility.key}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facilitiesArray && onSaveArray ? 
                        localFacilitiesArray.includes(facility.label) :
                        localFacilities[facility.key]
                      }
                      onChange={() => {
                        if (facilitiesArray && onSaveArray) {
                          if (localFacilitiesArray.includes(facility.label)) {
                            setLocalFacilitiesArray(prev => prev.filter(f => f !== facility.label));
                          } else {
                            setLocalFacilitiesArray(prev => [...prev, facility.label]);
                          }
                        } else {
                          handleToggle(facility.key);
                        }
                      }}
                      className="text-brand-600 focus:ring-brand-500 rounded"
                      aria-describedby={facility.helper ? `${facility.key}-helper` : undefined}
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900">
                        {facility.label}
                      </span>
                      {facility.helper && (
                        <p 
                          id={`${facility.key}-helper`}
                          className="text-xs text-slate-500 mt-0.5"
                        >
                          {facility.helper}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}