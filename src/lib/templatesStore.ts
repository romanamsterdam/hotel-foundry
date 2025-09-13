import { PropertyTemplate } from '../types/property';
import seedData from '../data/propertyTemplates.seed.json';
import { normalizeRooms, computeTotalRoomsFromBreakdown } from './deals/normalizers';
import { asStr } from './strings';

const asNum = (v: unknown, fallback = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : fallback);
const asArr = <T>(v: unknown, fallback: T[] = []) => (Array.isArray(v) ? v as T[] : fallback);

export function normalizeTemplate(pt: Partial<PropertyTemplate>): PropertyTemplate {
  const roomBreakdown = normalizeRooms(pt.roomBreakdown);
  const roomsTotal = asNum(pt.roomsTotal, computeTotalRoomsFromBreakdown(roomBreakdown));

  return {
    id: asStr(pt.id, crypto.randomUUID()),
    slug: asStr(pt.slug, ''),
    dealName: asStr(pt.dealName, 'Untitled Property'),
    city: asStr(pt.city, ''),
    country: asStr(pt.country, ''),
    fullAddress: asStr(pt.fullAddress, ''),
    photoUrl: asStr(pt.photoUrl, ''),
    propertyType: (pt.propertyType as PropertyTemplate['propertyType']) ?? 'Boutique Hotel',
    featured: Boolean(pt.featured),
    stars: (pt.stars as PropertyTemplate['stars']) ?? 4,
    currency: (pt.currency as PropertyTemplate['currency']) ?? 'EUR',
    gfaSqm: asNum(pt.gfaSqm, 0),
    purchasePrice: asNum(pt.purchasePrice, 0),
    roomsTotal,
    roomBreakdown,
    facilities: asArr<Facility>(pt.facilities, []),
    showInTemplates: Boolean(pt.showInTemplates ?? true),
    showInGallery: Boolean(pt.showInGallery ?? true),
    createdAt: asStr(pt.createdAt, new Date().toISOString()),
    updatedAt: asStr(pt.updatedAt, new Date().toISOString()),
  };
}

const KEY = 'hf_property_templates_v1';
let cache: PropertyTemplate[] = [];

function load(): PropertyTemplate[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      return (JSON.parse(stored) as Partial<PropertyTemplate>[]).map(normalizeTemplate);
    }
  } catch (error) {
    console.warn('Failed to load templates from localStorage:', error);
  }
  
  // Fallback to seed data
  return (seedData as Partial<PropertyTemplate>[]).map(normalizeTemplate);
}

function save(templates: PropertyTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
    cache = [...templates];
  } catch (error) {
    console.warn('Failed to save templates to localStorage:', error);
  }
}

// Initialize cache
cache = load();

export function getAll(): PropertyTemplate[] {
  return [...cache];
}

export function getById(id: string): PropertyTemplate | undefined {
  return cache.find(t => t.id === id);
}

export function upsert(template: PropertyTemplate): PropertyTemplate {
  const normalized = normalizeTemplate(template);
  const now = new Date().toISOString();
  const updatedTemplate = {
    ...normalized,
    slug: normalized.dealName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    roomsTotal: normalized.roomBreakdown.reduce((sum, room) => sum + room.count, 0),
    updatedAt: now,
    // Preserve createdAt for existing templates, set for new ones
    createdAt: normalized.createdAt || now
  };
  
  const index = cache.findIndex(t => t.id === normalized.id);
  if (index >= 0) {
    cache[index] = updatedTemplate;
  } else {
    cache.push(updatedTemplate);
  }
  
  save(cache);
  return updatedTemplate;
}

export function remove(id: string): void {
  cache = cache.filter(t => t.id !== id);
  save(cache);
}

export const selectors = {
  forTemplates: () => getAll().filter(x => !!x.showInTemplates),
  forGallery: () => getAll().filter(x => !!x.showInGallery),
  featured: () => getAll().filter(x => !!x.featured)
};