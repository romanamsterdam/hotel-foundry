import { Badge } from './ui/badge';
import { FacilityKey } from '../lib/types/property';
import { facilityLabel, facilityKey } from '../lib/deals/normalizers';

interface FacilitiesChipsProps {
  facilities: FacilityKey[] | {
    restaurant: boolean;
    bar: boolean;
    roomService: boolean;
    spa: boolean;
    parking: boolean;
    meetingEvents: boolean;
    pool: boolean;
  };
}

const facilityLabels = {
  pool: 'Pool',
  spa: 'Spa',
  restaurant: 'Restaurant',
  bar: 'Bar',
  gym: 'Gym',
  parking: 'Parking',
  conference: 'Meeting & Events',
  beach: 'Beach',
  kidsClub: 'Kids Club',
  other: 'Other',
  roomService: 'Room Service',
  meetingEvents: 'Meeting & Events'
};

export default function FacilitiesChips({ facilities }: FacilitiesChipsProps) {
  let selectedFacilities: string[];
  
  if (Array.isArray(facilities)) {
    // New format: array of FacilityKey
    selectedFacilities = facilities.map(f => facilityLabel(f) || facilityLabels[facilityKey(f)] || String(f));
  } else {
    // Legacy format: object with boolean values
    selectedFacilities = Object.entries(facilities)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => facilityLabels[key as keyof typeof facilityLabels]);
  }

  if (selectedFacilities.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No facilities selected yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedFacilities.map((facility) => (
        <Badge
          key={facilityKey(facility)}
          variant="secondary"
          className="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label={`${facility} facility enabled`}
        >
          {facilityLabel(facility)}
        </Badge>
      ))}
    </div>
  );
}