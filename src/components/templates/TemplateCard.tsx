import { CatalogProperty } from "../../lib/data/catalog";
import { computeTotalRoomsFromBreakdown } from "../../lib/deals/normalizers";
import { Badge } from "../ui/badge";
import SafeImage from "../SafeImage";
import { PropertyTemplate } from "../../types/property";
import { getInitials, asStr } from "../../lib/strings";
import { facilityLabel, facilityKey } from "../../lib/deals/normalizers";

type Props = {
  item: PropertyTemplate;
  onSelect: (id: string) => void;
};

const FACILITY_LABEL: Record<string, string> = {
  pool: "Pool", 
  spa: "Spa", 
  restaurant: "Restaurant", 
  bar: "Bar", 
  gym: "Gym",
  parking: "Parking", 
  conference: "Conference", 
  beach: "Beach",
  kidsClub: "Kids", 
  other: "Other",
};

export default function TemplateCard({ item, onSelect }: Props) {
  const totalRooms = item.roomsTotal || computeTotalRoomsFromBreakdown(item.roomBreakdown);
  const facilities = Array.isArray(item.facilities) ? [...new Set(item.facilities)] : [];
  const price = item.purchasePrice ?? 0;
  const initials = getInitials(item.dealName, 'P');
  const location = [asStr(item.city), asStr(item.country)].filter(Boolean).join(', ') || 'Location TBD';

  return (
    <button
      onClick={() => onSelect(item.id)}
      className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all duration-200 hover:-translate-y-1"
    >
      <div className="space-y-4">
        {/* Header with image and basic info */}
        <div className="flex items-start gap-3">
          <SafeImage
            src={item.photoUrl}
            fallbackText={initials}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            alt={asStr(item.dealName, 'Property')}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="truncate text-base font-semibold text-slate-900">{asStr(item.dealName, 'Untitled Property')}</h3>
              {item.featured && (
                <Badge className="bg-amber-100 text-amber-700 text-xs">Featured</Badge>
              )}
            </div>
            <div className="text-sm text-slate-600 truncate">
              {location}
            </div>
            {item.stars && (
              <div className="flex items-center mt-1">
                {[...Array(item.stars)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">Rooms</div>
            <div className="text-lg font-bold text-slate-900">{totalRooms || 0}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">Purchase Price</div>
            <div className="text-lg font-bold text-slate-900">
              {price ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: item.currency || 'EUR',
                maximumFractionDigits: 0,
                notation: price >= 1000000 ? "compact" : "standard"
              }).format(price) : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">Stars</div>
            <div className="text-lg font-bold text-slate-900">{item.stars ?? 4}</div>
          </div>
        </div>

        {/* Facilities */}
        {facilities.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Facilities</div>
            <div className="flex flex-wrap gap-1.5">
              {facilities.slice(0, 6).map((f) => (
                <span 
                  key={facilityKey(f) || 'facility'} 
                  className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200 px-2 py-1 text-xs font-medium text-brand-700"
                >
                  {FACILITY_LABEL[facilityLabel(f)] || facilityLabel(f) || 'Facility'}
                </span>
              ))}
              {facilities.length > 6 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                  +{facilities.length - 6}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}