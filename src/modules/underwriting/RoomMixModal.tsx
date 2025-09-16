import { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { RoomType } from '../../types/deal';
import { totalRooms, getRoomsTotal, isRoomMixValid } from '../../lib/rooms';
import { computeTotalRooms } from '../../lib/deals/normalizers';
import { RoomTypeItem } from '../../lib/types/property';
import { RoomMixSchema, RoomTypeSchema } from './schemas/roomMix';
import type { RoomTypeParsed } from './schemas/roomMix';

type Props = {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function RoomMixModal({ dealId, isOpen, onClose, onSaved }: Props) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Load room types when modal opens - safe fallbacks
  useEffect(() => {
    if (!isOpen) return;
    const deal = getDeal(dealId);
    const legacy = Array.isArray(deal?.roomTypes) ? deal!.roomTypes : [];
    const normalized = Array.isArray(deal?.normalizedRooms) ? deal!.normalizedRooms : [];
    const seed = (normalized.length ? normalized.map(r => ({
      id: r.id || crypto.randomUUID(),
      name: r.name ?? String(r.type ?? ""),
      rooms: Number(r.count) || 0,
      adrWeight: Number((r as any).adrWeight) || 100,
    })) : legacy.map(rt => ({
      id: rt.id || crypto.randomUUID(),
      name: rt.name ?? "",
      rooms: Number(rt.rooms) || 0,
      adrWeight: Number(rt.adrWeight) || 100,
    })));

    setErrors({});
    setRoomTypes(seed);
  }, [dealId, isOpen]);

  // Re-validate whenever local list changes
  useEffect(() => {
    try {
      const parsed = RoomMixSchema.parse(roomTypes);
      const errs: Record<string, string> = {};
      // business rule: at least one room in total
      const { ok } = isRoomMixValid(parsed);
      setIsValid(ok);
      setErrors(errs);
    } catch (e: any) {
      const errs: Record<string, string> = {};
      if (Array.isArray(e?.issues)) {
        for (const issue of e.issues) {
          // path [index, field]
          const [idx, field] = issue.path as [number, string];
          errs[`${String(field)}-${idx}`] = issue.message;
        }
      }
      setErrors(errs);
      setIsValid(false);
    }
  }, [roomTypes]);

  const handleAddRoomType = () => {
    if (roomTypes.length >= 5) return;
    
    setRoomTypes([
      ...roomTypes,
      {
        id: crypto.randomUUID(),
        name: '',
        rooms: 0,
        adrWeight: 100
      }
    ]);
  };

  const handleRemoveRoomType = (index: number) => {
    if (roomTypes.length <= 1) return;
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
  };

  const handleRoomTypeChange = (index: number, field: keyof RoomType, value: string | number) => {
    setRoomTypes(prev => {
      const next = [...prev];
      const row = { ...next[index] };
      if (field === 'rooms' || field === 'adrWeight') {
        row[field] = Number(value);
      } else if (field === 'name') {
        row.name = String(value);
      }
      next[index] = row;
      return next;
    });
  };

  const handleSave = () => {
    if (!isValid) return;

    // Parse & normalize once more on save
    const parsed = RoomMixSchema.parse(roomTypes);
    const filtered = parsed.filter(rt => rt.name.trim() !== "");
    const deal = getDeal(dealId);
    if (!deal) return;

    // Legacy shapes
    const legacyRoomTypes = filtered.map(rt => ({ id: rt.id, name: rt.name, rooms: rt.rooms, adrWeight: rt.adrWeight }));
    const legacyRooms = filtered.map(rt => ({ id: rt.id, type: rt.name, count: rt.rooms, sqm: undefined, adrBase: undefined }));

    // New canonical shape
    const normalizedRooms = filtered.map(rt => ({ id: rt.id, name: rt.name, count: rt.rooms, sqm: undefined, adrBase: undefined }));

    const updatedDeal = {
      ...deal,
      roomTypes: legacyRoomTypes,
      rooms: legacyRooms,
      normalizedRooms,
      totalRooms: getRoomsTotal(filtered),
      updatedAt: new Date().toISOString(),
    };

    upsertDeal(updatedDeal);
    onSaved?.();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Empty state
  const showEmptyState = roomTypes.length === 0;
  const totalRoomsCount = getRoomsTotal(roomTypes);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Room Mix</DialogTitle>
          <p className="text-sm text-slate-600">
            Configure your hotel's room types and their relative pricing weights.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6">
          {showEmptyState ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No room types configured yet.</p>
              <Button onClick={handleAddRoomType} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Standard Room Type
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                <div className="col-span-4">Room Type Name</div>
                <div className="col-span-3">Number of Rooms</div>
                <div className="col-span-4 flex items-center gap-1">
                  <span>ADR Weight (Index %)</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-400 hover:text-slate-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        ADR Weight sets the relative price index for this room type. 
                        100 = base room ADR (e.g., Standard). 
                        120 = 20% premium, 80 = 20% discount.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Room Type Rows */}
              {roomTypes.map((roomType, index) => (
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Number of Rooms
                      </label>
                      <input
                        type="number"
                        value={roomType.rooms ?? ''}
                        onChange={(e) => handleRoomTypeChange(index, 'rooms', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`rooms-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors[`rooms-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`rooms-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <span>ADR Weight (Index %)</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-slate-400 hover:text-slate-600">
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-sm">
                              ADR Weight sets the relative price index for this room type. 
                              100 = base room ADR (e.g., Standard). 
                              120 = 20% premium, 80 = 20% discount.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <input
                        type="number"
                        value={roomType.adrWeight ?? ''}
                        onChange={(e) => handleRoomTypeChange(index, 'adrWeight', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`adrWeight-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="100"
                        min="50"
                        max="300"
                      />
                      {errors[`adrWeight-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`adrWeight-${index}`]}</p>
                      )}
                    </div>

                    {roomTypes.length > 1 && (
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
                    <div className="col-span-4">
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

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={roomType.rooms ?? ''}
                        onChange={(e) => handleRoomTypeChange(index, 'rooms', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`rooms-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors[`rooms-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`rooms-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        value={roomType.adrWeight ?? ''}
                        onChange={(e) => handleRoomTypeChange(index, 'adrWeight', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors[`adrWeight-${index}`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="100"
                        min="50"
                        max="300"
                      />
                      {errors[`adrWeight-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`adrWeight-${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-1">
                      {roomTypes.length > 1 && (
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
              {roomTypes.length < 5 && (
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

              {/* Total Rooms & Validation */}
              <div className="border-t border-slate-200 pt-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    Total Rooms: <span className="text-lg font-semibold text-slate-900">{totalRoomsCount}</span>
                  </div>
                  {!isValid && totalRoomsCount === 0 && (
                    <p className="text-sm text-red-600">Total rooms must be greater than 0</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}