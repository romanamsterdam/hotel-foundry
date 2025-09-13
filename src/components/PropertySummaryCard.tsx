import React from "react";
import { MapPin, Building2, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Deal } from "../types/deal";
import { normalizeLocation, normalizeFacilities, computeTotalRooms } from "../lib/deals/normalizers";
import { facilityLabel, facilityKey } from "../lib/deals/normalizers";
import { getTotalRooms } from "../lib/rooms";

interface PropertySummaryCardProps {
  deal: Deal;
  className?: string;
}

export default function PropertySummaryCard({ deal, className = "" }: PropertySummaryCardProps) {
  // Use normalized location
  const location = normalizeLocation(deal);
  
  // Get total rooms using existing utility
  const totalRooms = getTotalRooms(deal);
  
  // Normalize facilities to prevent duplicates
  const facilitiesInput = Array.isArray(deal.facilities) ? deal.facilities : 
                         deal.amenities ? Object.entries(deal.amenities)
                           .filter(([_, enabled]) => enabled)
                           .map(([key, _]) => {
                             const facilityMap: Record<string, string> = {
                               restaurant: 'Restaurant',
                               bar: 'Bar',
                               roomService: 'Room Service',
                               spa: 'Spa',
                               parking: 'Parking',
                               meetingsEvents: 'Meeting & Events',
                               pool: 'Pool',
                               gym: 'Gym'
                             };
                             return facilityMap[key] || key;
                           }) : [];
  
  const facilities = normalizeFacilities(facilitiesInput);

  return (
    <Card className={`border-slate-200 ${className}`}>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Location */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-slate-600" />
              <span className="text-xs uppercase font-medium text-slate-600">Location</span>
            </div>
            <div className="text-base font-semibold text-slate-900">{location}</div>
          </div>

          {/* Total Rooms */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              <span className="text-xs uppercase font-medium text-slate-600">Total Rooms</span>
            </div>
            <div className="text-base font-semibold text-slate-900">
              {totalRooms > 0 ? `${totalRooms} rooms` : "No rooms configured"}
            </div>
          </div>

          {/* Facilities */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-slate-600" />
              <span className="text-xs uppercase font-medium text-slate-600">Facilities</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {facilities.length > 0 ? (
                facilities.map((facility) => (
                  <Badge
                    key={facilityKey(facility)}
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 text-xs"
                  >
                    {facilityLabel(facility)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No facilities</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}