import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/toast';
import { newId, upsertDeal } from '../lib/dealStore';
import { Deal } from '../types/deal';
import { PropertyCore, SampleProperty } from '../types/property';
import { formatCurrency } from '../lib/utils';
import SafeImage from '../components/SafeImage';
import { normalizeTemplateToDeal } from '../lib/deals/normalizeTemplate';
import { computeTotalRoomsFromBreakdown, computeTotalRooms } from '../lib/deals/normalizers';
import { selectors } from '../lib/templatesStore';
import { PropertyTemplate } from '../types/property';
import { withUnifiedPurchasePrice, normalizeFacilities, normalizeRoomTypes } from '../lib/deals/normalizers';
import { currentUser } from '../lib/user';
import TemplateCard from '../components/templates/TemplateCard';
import { getInitials, asStr, safeLocation } from '../lib/strings';

interface CreateDealFormState {
  property: PropertyCore;
  dealName: string;
  selectedTemplate: PropertyTemplate | null;
}

const defaultProperty: PropertyCore = {
  name: '',
  location: '',
  address: '',
  photoUrl: '',
  propertyType: 'Boutique',
  starRating: 4,
  currency: 'EUR',
  gfaSqm: 0,
  purchasePrice: 0,
  facilities: [],
  roomTypes: [],
  totalRooms: 0,
};

export default function CreateDealPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [form, setForm] = useState<CreateDealFormState>({
    property: defaultProperty,
    dealName: '',
    selectedTemplate: null
  });
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<PropertyTemplate[]>([]);

  // Helper functions for template display
  function templateLocation(t?: { city?: string; country?: string; address?: string }) {
    return safeLocation(t?.city, t?.country) || asStr(t?.address, '—');
  }

  const selectedRooms = form.selectedTemplate?.roomsTotal || computeTotalRoomsFromBreakdown(form.selectedTemplate?.roomBreakdown || []);
  const selectedLocation = templateLocation(form.selectedTemplate || undefined);

  // Load catalog templates
  useEffect(() => {
    const templateList: PropertyTemplate[] = selectors.forTemplates();
    setTemplates(templateList);
  }, []);

  useEffect(() => {
    // Check for template property from admin "Use as Template"
    const template = (location.state as any)?.templateProperty;
    if (template) {
      // Normalize template data
      const unified = withUnifiedPurchasePrice({ ...template });
      unified.rooms = normalizeRoomTypes(unified.rooms);
      unified.facilities = normalizeFacilities(unified.facilities);
      
      setForm(prev => ({
        ...prev,
        selectedTemplate: unified
      }));
      
      // Normalize template data
      const normalizedTemplate = normalizeTemplateToDeal({
        name: unified.name,
        currency: unified.currency || 'EUR',
        rooms: unified.roomBreakdown?.map((rt: any) => ({
          id: rt.id,
          type: rt.name || rt.type,
          count: rt.count || rt.rooms || 0,
          sqm: rt.sqm,
          adrBase: rt.baseAdr || rt.adrBase
        })) || [],
        facilities: unified.facilities || []
      });
      
      setForm(prev => ({
        ...prev,
        dealName: `${asStr(unified.name, 'Property')} Analysis`,
        property: {
          name: asStr(unified.name, 'Untitled Property'),
          location: templateLocation(unified),
          address: asStr(unified.address, ''),
          photoUrl: asStr(unified.photoUrl, ''),
          propertyType: unified.propertyType as PropertyCore['propertyType'] || 'Boutique',
          starRating: unified.starRating || 4,
          currency: unified.currency || 'EUR',
          gfaSqm: unified.buildingGfaSqm || 0,
          purchasePrice: unified.purchasePrice || 0,
          facilities: normalizeFacilities(unified.facilities),
          roomTypes: normalizedTemplate.rooms?.map(r => ({
            id: r.id || crypto.randomUUID(),
            name: r.type,
            count: r.count,
            baseAdr: r.adrBase,
            baseOcc: undefined
          })) || [],
          totalRooms: computeTotalRooms(normalizedTemplate.rooms) || 0,
        },
      }));
    }
  }, [location.state]);

  const hasFacility = (facilities: any, facilityName: string): boolean => {
    if (!facilities) return false;
    if (Array.isArray(facilities)) {
      return facilities.includes(facilityName);
    }
    if (typeof facilities === 'object') {
      return Boolean(facilities[facilityName]);
    }
    return false;
  };

  const createDefaultAmenities = () => ({
    spa: hasFacility(form.selectedTemplate?.facilities, 'Spa') || hasFacility(form.property.facilities, 'Spa'),
    pool: hasFacility(form.selectedTemplate?.facilities, 'Pool') || hasFacility(form.property.facilities, 'Pool'),
    restaurant: hasFacility(form.selectedTemplate?.facilities, 'Restaurant') || hasFacility(form.property.facilities, 'Restaurant'),
    bar: hasFacility(form.selectedTemplate?.facilities, 'Bar') || hasFacility(form.property.facilities, 'Bar'),
    gym: hasFacility(form.property.facilities, 'Gym'),
    meetingsEvents: hasFacility(form.selectedTemplate?.facilities, 'Conference') || hasFacility(form.property.facilities, 'Conference'),
    parking: hasFacility(form.selectedTemplate?.facilities, 'Parking') || hasFacility(form.property.facilities, 'Parking'),
    roomService: hasFacility(form.selectedTemplate?.facilities, 'RoomService') || hasFacility(form.property.facilities, 'RoomService'),
  });

  const handleTemplateSelect = (template: PropertyTemplate) => {
    // Use unified normalizer to handle purchasePrice
    const unified = withUnifiedPurchasePrice({ ...template });
    
    // Normalize the template data
    const normalizedTemplate = {
      ...unified,
      rooms: normalizeRoomTypes(unified.roomBreakdown?.map(r => ({ 
        id: crypto.randomUUID(), 
        name: asStr(r.type, 'Room'), 
        count: r.count || 0
      })) || []),
      facilities: normalizeFacilities(unified.facilities)
    };
    
    setForm(prev => ({
      ...prev,
      selectedTemplate: normalizedTemplate
    }));
    
    // Normalize template data
    const dealTemplate = normalizeTemplateToDeal({
      name: unified.dealName,
      currency: unified.currency || 'EUR',
      rooms: unified.roomBreakdown?.map((rt: any) => ({
        id: rt.id,
        type: rt.type,
        count: rt.count || 0,
        sqm: rt.sqm,
        adrBase: rt.baseAdr
      })) || [],
      facilities: unified.facilities || []
    });
    
    setForm(prev => ({
      ...prev,
      dealName: `${asStr(unified.dealName, 'Property')} Analysis`,
      property: {
        name: asStr(unified.dealName, 'Untitled Property'),
        location: templateLocation(unified),
        address: asStr(unified.fullAddress, ''),
        photoUrl: asStr(unified.photoUrl, ''),
        propertyType: unified.propertyType as PropertyCore['propertyType'] || 'Boutique',
        starRating: unified.stars || 4,
        currency: unified.currency || 'EUR',
        gfaSqm: unified.gfaSqm || 0,
        purchasePrice: unified.purchasePrice || 0,
        facilities: normalizeFacilities(unified.facilities),
        roomTypes: unified.roomBreakdown?.map(r => ({
          id: r.id || crypto.randomUUID(),
          name: asStr(r.type, 'Room'),
          count: r.count || 0,
          baseAdr: undefined,
          baseOcc: undefined
        })) || [],
        totalRooms: unified.roomsTotal || 0,
      },
    }));
  };

  const handleTemplateSelectById = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      handleTemplateSelect(template);
    }
  };

  const handleClearTemplate = () => {
    setForm(prev => ({
      ...prev,
      selectedTemplate: null,
      dealName: '',
      property: defaultProperty,
    }));
  };

  const handleCreateDeal = async () => {
    if (!form.dealName.trim()) {
      toast.error('Please enter a deal name');
      return;
    }

    setIsCreating(true);

    try {
      const dealId = newId();
      const now = new Date().toISOString();

      // Convert PropertyCore roomTypes to Deal roomTypes format
      const sourceRoomTypes = form.selectedTemplate?.rooms || form.property.roomTypes;
      const dealRoomTypes = sourceRoomTypes.map(rt => ({
        id: rt.id,
        name: rt.name || rt.type,
        rooms: rt.count || rt.rooms || 0,
        adrWeight: 100 // Default weight, can be adjusted later
      }));

      const newDeal: Deal = {
        id: dealId,
        createdAt: now,
        updatedAt: now,
        name: form.dealName.trim(),
        location: form.selectedTemplate?.location || form.property.location || 'Location TBD',
        address: form.selectedTemplate?.address || form.property.address || '',
        propertyType: (form.selectedTemplate?.propertyType || form.property.propertyType) as Deal['propertyType'],
        stars: (form.selectedTemplate?.stars || form.property.starRating) as Deal['stars'],
        gfaSqm: form.selectedTemplate?.gfaSqm || form.property.gfaSqm || 0,
        purchasePrice: form.selectedTemplate?.purchasePrice || form.property.purchasePrice || 0,
        currency: (form.selectedTemplate?.currency || form.property.currency) as Deal['currency'],
        roomTypes: dealRoomTypes,
        rooms: sourceRoomTypes.map(rt => ({
          id: rt.id,
          type: rt.name || rt.type,
          count: rt.count || rt.rooms || 0,
          sqm: undefined,
          adrBase: rt.baseAdr || rt.adrBase
        })),
        normalizedRooms: sourceRoomTypes.map(rt => ({
          id: rt.id || crypto.randomUUID(),
          name: rt.name || rt.type,
          count: rt.count || rt.rooms || 0,
          sqm: rt.sqm,
          adrBase: rt.baseAdr || rt.adrBase
        })),
        facilities: normalizeFacilities(Array.isArray(form.selectedTemplate?.facilities) ? form.selectedTemplate.facilities : form.property.facilities || []),
        normalizedFacilities: (form.selectedTemplate?.facilities || form.property.facilities || []).map(f => {
          const facilityMap: Record<string, string> = {
            'Restaurant': 'restaurant',
            'Bar': 'bar',
            'Pool': 'pool',
            'Spa': 'spa',
            'Parking': 'parking',
            'Gym': 'gym',
            'Conference': 'conference',
            'Beach': 'beach',
            'Other': 'other'
          };
          return facilityMap[f] || 'other';
        }) as any,
        amenities: createDefaultAmenities(),
        photoUrl: form.selectedTemplate?.heroImageUrl || form.property.photoUrl || undefined,
        assumptions: {}
      };

      // Save the deal
      upsertDeal(newDeal);

      // Show success message
      toast.success('Deal created successfully!');

      // Navigate to the deal workspace
      navigate(`/underwriting/${dealId}`);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Deal</h1>
          <p className="text-gray-600">
            Set up your hotel investment analysis from scratch or using a template
          </p>
        </div>

        <div className="space-y-8">
          {/* Template Selection */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Choose Template (Optional)</span>
              </CardTitle>
              <p className="text-sm text-slate-600">
                Start with a pre-configured property template or create from scratch
              </p>
            </CardHeader>
            <CardContent>
              {form.selectedTemplate ? (
                <div className="rounded-xl border bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 font-semibold text-teal-700">
                        {getInitials(form.selectedTemplate.dealName, 'P')}
                      </div>
                      <div>
                        <div className="text-base font-semibold">{asStr(form.selectedTemplate.dealName, 'Untitled Property')}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedLocation}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{selectedRooms || 0} rooms</span>
                          </div>
                          {form.selectedTemplate.starRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                              <span>{form.selectedTemplate.starRating} star</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Property details will be pre-filled from this template
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearTemplate}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {templates.map((property) => (
                    <TemplateCard
                      key={property.id}
                      item={property}
                      onSelect={handleTemplateSelectById}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deal Name Input */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Deal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    value={form.dealName}
                    onChange={(e) => setForm(prev => ({ ...prev, dealName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Enter deal name..."
                  />
                </div>
                
                {form.selectedTemplate && (
                  <div className="text-sm text-slate-600">
                    <strong>Template:</strong> {asStr(form.selectedTemplate.dealName, 'Untitled Property')} • {form.selectedTemplate.roomsTotal || 0} rooms • {(form.selectedTemplate.facilities || []).length} facilities
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/underwriting')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeal}
              disabled={!form.dealName.trim() || isCreating}
              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Deal</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}