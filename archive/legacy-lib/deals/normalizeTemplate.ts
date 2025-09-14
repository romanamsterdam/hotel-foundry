import { Deal } from '../../types/deal';
import { PropertyTemplate } from '../../types/property';
import { asStr } from '../strings';
import { normalizeFacilities, normalizeRooms, computeTotalRoomsFromBreakdown } from './normalizers';

export function normalizeTemplateToDeal(template: Partial<PropertyTemplate>): Partial<Deal> {
  const roomBreakdown = normalizeRooms(template.roomBreakdown);
  const roomsTotal = computeTotalRoomsFromBreakdown(roomBreakdown);
  
  // Convert to RoomTypeItem format for Deal
  const rooms = roomBreakdown.map(r => ({
    id: crypto.randomUUID(),
    name: r.type,
    count: r.count,
    sqm: undefined,
    adrBase: undefined
  }));

  return {
    name: asStr(template.dealName, 'Untitled Property'),
    location: [asStr(template.city), asStr(template.country)].filter(Boolean).join(', ') || 'Location TBD',
    address: asStr(template.fullAddress, ''),
    propertyType: template.propertyType as Deal['propertyType'] || 'Boutique',
    stars: template.stars as Deal['stars'] || 4,
    gfaSqm: template.gfaSqm || 0,
    purchasePrice: template.purchasePrice || 0,
    currency: template.currency as Deal['currency'] || 'EUR',
    photoUrl: asStr(template.photoUrl, ''),
    rooms: rooms.map(r => ({
      id: r.id,
      type: r.name,
      count: r.count,
      sqm: r.sqm,
      adrBase: r.adrBase
    })),
    normalizedRooms: rooms,
    facilities: normalizeFacilities(template.facilities || []),
    totalRooms: roomsTotal
  };
}