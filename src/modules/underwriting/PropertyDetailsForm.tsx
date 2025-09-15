import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { totalRooms } from '../../lib/rooms';
import { Deal, CurrencyCode, Amenities } from '../../types/deal';
import { computeTotalRooms } from '../../lib/deals/normalizers';
import { normalizeFacilities } from '../../lib/deals/normalizers';
import { RoomTypeItem, FacilityKey } from '../../lib/types/property';
import { facilityLabel, facilityKey } from '../../lib/deals/normalizers';
import RoomMixModal from './RoomMixModal';
import FacilitiesChips from '../../components/FacilitiesChips';
import FacilitiesModal from '../../components/FacilitiesModal';

const propertyTypes = ["Economy", "Midscale", "Upscale", "Luxury", "Boutique"] as const;
const currencies: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "USD", symbol: "$", label: "USD ($)" }
];

interface PropertyDetailsFormProps {
  dealId: string;
  onSaved?: () => void;
}

export default function PropertyDetailsForm({ dealId, onSaved }: PropertyDetailsFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [roomMixOpen, setRoomMixOpen] = useState(false);
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string>('');
  
  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<string>('Boutique');
  const [stars, setStars] = useState<number>(4);
  const [gfaSqm, setGfaSqm] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoUrlError, setPhotoUrlError] = useState<string>('');

  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (!foundDeal) {
      navigate('/underwriting');
      return;
    }

    setDeal(foundDeal);
    
    // Pre-populate form
    setName(foundDeal.name);
    setLocation(foundDeal.location);
    setAddress(foundDeal.address);
    setPropertyType(foundDeal.propertyType);
    setStars(foundDeal.stars);
    setGfaSqm(foundDeal.gfaSqm);
    setPurchasePrice(foundDeal.purchasePrice);
    setCurrency(foundDeal.currency);
    setPhotoUrl(foundDeal.photoUrl || '');
  }, [dealId, navigate, refreshToken]);

  const validatePhotoUrl = (url: string) => {
    if (!url.trim()) {
      setPhotoUrlError('');
      return true;
    }
    
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    if (!urlPattern.test(url)) {
      setPhotoUrlError('Please enter a valid image URL (JPG, PNG, or WebP)');
      return false;
    }
    
    setPhotoUrlError('');
    return true;
  };

  const handlePhotoUrlChange = (value: string) => {
    setPhotoUrl(value);
    validatePhotoUrl(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Deal name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!propertyType) newErrors.propertyType = 'Property type is required';
    if (stars < 1 || stars > 5) newErrors.stars = 'Star rating must be between 1 and 5';
    if (gfaSqm < 0) newErrors.gfaSqm = 'Floor area cannot be negative';
    if (purchasePrice < 0) newErrors.purchasePrice = 'Purchase price cannot be negative';
    if (!currency) newErrors.currency = 'Currency is required';
    if (photoUrl && photoUrlError) newErrors.photoUrl = photoUrlError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simulate database save (placeholder for Supabase)
  const saveToSupabase = async (updatedData: Deal): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate for demo
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Network error - please try again'));
        }
      }, 1500);
    });
  };

  const handleSave = async () => {
    if (!deal || !validateForm() || saveState === 'saving') return;

    setSaveState('saving');
    setSaveError('');
    setShowSuccessMessage(false);

    try {
      // Save to Supabase first
      await persistToBackend("Property Details");
      
      // Then update local storage for immediate UI updates
      const updatedDeal: Deal = {
        ...deal,
        name: name.trim(),
        location: location.trim(),
        address: address.trim(),
        propertyType: propertyType as Deal['propertyType'],
        stars: stars as Deal['stars'],
        gfaSqm,
        purchasePrice,
        currency,
        photoUrl: photoUrl.trim() || undefined,
        // Update budget net purchase price if budget exists
        budget: deal.budget ? {
          ...deal.budget,
          netPurchasePrice: purchasePrice
        } : undefined,
      };

      // Save to local storage immediately
      upsertDeal(updatedDeal);
      setCompleted(dealId, "propertyDetails", true);

      setSaveState('success');
      setShowSuccessMessage(true);
      
      // Trigger KPI recalculation
      if (onSaved) {
        onSaved();
      }

      // Revert to default state after 2 seconds
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error: any) {
      setSaveState('error');
      setSaveError(error.message || 'Failed to save changes');
      
      // Revert to default state after 3 seconds
      setTimeout(() => {
        setSaveState('idle');
        setSaveError('');
      }, 3000);
    }
  };

  const handleCancel = () => {
    if (!deal) return;
    
    // Revert to stored values
    setName(deal.name);
    setLocation(deal.location);
    setAddress(deal.address);
    setPropertyType(deal.propertyType);
    setStars(deal.stars);
    setGfaSqm(deal.gfaSqm);
    setPurchasePrice(deal.purchasePrice);
    setCurrency(deal.currency);
    setPhotoUrl(deal.photoUrl || '');
    setErrors({});
  };

  const handleRoomMixSaved = () => {
    setRoomMixOpen(false);
    // Re-read deal and refresh KPIs
    setRefreshToken(crypto.randomUUID());
    toast.success("Room mix updated");
    if (onSaved) {
      onSaved();
    }
  };

  const handleFacilitiesSaved = (newFacilities: Amenities) => {
    if (!deal) return;
    
    // Convert amenities object to facilities array
    const facilitiesStringArray = Object.entries(newFacilities)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => {
        const facilityMap: Record<string, string> = {
          restaurant: 'Restaurant',
          bar: 'Bar',
          roomService: 'Room Service',
          spa: 'Spa',
          parking: 'Parking',
          meetingsEvents: 'Meeting & Events',
          pool: 'Pool'
        };
        return facilityMap[key] || key;
      });
    
    // Convert to FacilityKey array
    const facilitiesKeyArray = facilitiesStringArray.map(f => {
      const keyMap: Record<string, FacilityKey> = {
        'Restaurant': 'restaurant',
        'Bar': 'bar',
        'Room Service': 'other',
        'Spa': 'spa',
        'Parking': 'parking',
        'Meeting & Events': 'conference',
        'Pool': 'pool',
        'Gym': 'gym'
      };
      return keyMap[f] || 'other';
    }) as FacilityKey[];
    
    const updatedDeal: Deal = {
      ...deal,
      amenities: newFacilities,
      facilities: normalizeFacilities(facilitiesStringArray),
      normalizedFacilities: facilitiesKeyArray,
      updatedAt: new Date().toISOString()
    };

    upsertDeal(updatedDeal);
    setDeal(updatedDeal);
    setFacilitiesOpen(false);
    
    // Trigger KPI recalculation
    if (onSaved) {
      onSaved();
    }
  };

  // Check for revenue conflicts when facilities are disabled
  const getRevenueConflicts = () => {
    if (!deal) return {};
    
    const conflicts: { restaurant?: boolean; bar?: boolean; spa?: boolean } = {};
    
    // Use normalized facilities array if available, fallback to amenities object
    const facilities = Array.isArray(deal.facilities) ? deal.facilities : [];
    const hasRestaurant = facilities.includes('Restaurant') || deal.amenities?.restaurant;
    const hasBar = facilities.includes('Bar') || deal.amenities?.bar;
    const hasSpa = facilities.includes('Spa') || deal.amenities?.spa;
    
    // Check F&B revenue conflicts
    if (deal.fnbRevenue) {
      const { fnbRevenue } = deal;
      
      if (fnbRevenue.mode === 'advanced') {
        const hasRestaurantRevenue = 
          fnbRevenue.advanced.breakfast.guestCapturePct > 0 ||
          fnbRevenue.advanced.breakfast.externalCoversPerDay > 0 ||
          fnbRevenue.advanced.lunch.guestCapturePct > 0 ||
          fnbRevenue.advanced.lunch.externalCoversPerDay > 0 ||
          fnbRevenue.advanced.dinner.guestCapturePct > 0 ||
          fnbRevenue.advanced.dinner.externalCoversPerDay > 0;
          
        const hasBarRevenue = 
          fnbRevenue.advanced.bar.guestCapturePct > 0 ||
          fnbRevenue.advanced.bar.externalCoversPerDay > 0;
          
        if (hasRestaurantRevenue && !hasRestaurant) conflicts.restaurant = true;
        if (hasBarRevenue && !hasBar) conflicts.bar = true;
      } else {
        // Simple mode - assume restaurant revenue if any capture/external
        if ((fnbRevenue.simple.totalGuestCapturePct > 0 || fnbRevenue.simple.externalCoversPerDay > 0) && !hasRestaurant) {
          conflicts.restaurant = true;
        }
      }
    }
    
    // Check spa revenue conflicts
    if (deal.otherRevenue) {
      const hasSpaRevenue = 
        deal.otherRevenue.spa.treatmentsPerDay > 0 ||
        deal.otherRevenue.spa.avgPricePerTreatment > 0;
      if (hasSpaRevenue && !hasSpa) conflicts.spa = true;
    }
    
    return conflicts;
  };
  if (!deal) {
    return <div>Loading...</div>;
  }

  // Use normalized rooms data if available, fallback to legacy roomTypes
  const normalizedRooms = Array.isArray(deal.normalizedRooms) ? deal.normalizedRooms :
                          Array.isArray(deal.rooms) ? deal.rooms.map(r => ({
                            id: r.id || crypto.randomUUID(),
                            name: r.type,
                            count: r.count,
                            sqm: r.sqm,
                            adrBase: r.adrBase
                          })) : [];
  const legacyRoomTypes = deal.roomTypes || [];
  const totalRoomsCount = normalizedRooms.length > 0 ? 
    computeTotalRooms(normalizedRooms) : 
    totalRooms(legacyRoomTypes);
  
  // Use normalized facilities if available, fallback to amenities
  const facilitiesArray = normalizeFacilities(
    Array.isArray(deal.normalizedFacilities) ? deal.normalizedFacilities :
    Array.isArray(deal.facilities) ? deal.facilities : 
    Object.entries(deal.amenities || {})
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => {
        const facilityMap: Record<string, string> = {
          restaurant: 'Restaurant',
          bar: 'Bar',
          roomService: 'Room Service',
          spa: 'Spa',
          parking: 'Parking',
          meetingsEvents: 'Meeting & Events',
          pool: 'Pool'
        };
        return facilityMap[key] || key;
      })
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h3>
        <p className="text-sm text-slate-600 mb-6">
          Update the basic information about your hotel property and investment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Deal Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              errors.name ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="Enter deal name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              errors.location ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="e.g., Ibiza, Spain"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Full Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder="Enter full address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Photo URL (optional)
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => handlePhotoUrlChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
            errors.photoUrl ? 'border-red-500' : 'border-slate-300'
          }`}
          placeholder="https://example.com/image.jpg"
        />
        <p className="mt-1 text-xs text-slate-500">
          Paste a direct image URL (JPG/PNG/WebP)
        </p>
        {errors.photoUrl && <p className="mt-1 text-sm text-red-600">{errors.photoUrl}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Property Type *
          </label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyType && <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Star Rating *
          </label>
          <Select value={stars.toString()} onValueChange={(v) => setStars(Number(v))}>
            <SelectTrigger className={errors.stars ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((star) => (
                <SelectItem key={star} value={star.toString()}>
                  {star} Star{star !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.stars && <p className="mt-1 text-sm text-red-600">{errors.stars}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Currency *
          </label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
            <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Building Gross Floor Area (sqm) *
          </label>
          <input
            type="number"
            value={gfaSqm || ''}
            onChange={(e) => setGfaSqm(Number(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              errors.gfaSqm ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="0"
            min="0"
          />
          {errors.gfaSqm && <p className="mt-1 text-sm text-red-600">{errors.gfaSqm}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Purchase Price *
          </label>
          <input
            type="number"
            value={purchasePrice || ''}
            onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              errors.purchasePrice ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="0"
            min="0"
          />
          {errors.purchasePrice && <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>}
          <p className="mt-1 text-xs text-slate-500">
            💡 Total acquisition/CapEx to date. You can refine the detailed budget in 'Investment Budget'.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total Rooms (read-only)
            </label>
            <div className="text-lg font-semibold text-slate-900">{totalRoomsCount} rooms</div>
            <p className="text-xs text-slate-500">
              {normalizedRooms.length > 0 ?
                normalizedRooms.map(r => `${r.count} ${r.name}`).join(' · ') :
                'Based on your room type configuration'
              }
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRoomMixOpen(true)}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Edit room mix</span>
          </Button>
        </div>
      </div>

      {/* Facilities Card */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Facilities
            </label>
            {facilitiesArray.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No facilities selected yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {facilitiesArray.map((facility) => (
                  <span
                    key={facilityKey(facility)}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
                  >
                    {facilityLabel(facility)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFacilitiesOpen(true)}
            className="flex items-center space-x-2"
          >
            <span>Edit Facilities</span>
          </Button>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center space-x-3 mb-2">
          <Button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={`${
              saveState === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-brand-600 hover:bg-brand-700'
            } text-white flex items-center space-x-2`}
          >
            {saveState === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveState === 'success' && <Check className="h-4 w-4" />}
            <span>
              {saveState === 'saving' && 'Saving...'}
              {saveState === 'success' && 'Saved'}
              {(saveState === 'idle' || saveState === 'error') && 'Save changes'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saveState === 'saving'}
          >
            Cancel
          </Button>
          
          {/* Success message */}
          {showSuccessMessage && (
            <div className="flex items-center space-x-2 text-green-600 text-sm font-medium animate-in fade-in-0 duration-300">
              <Check className="h-4 w-4" />
              <span>Changes saved and numbers updated</span>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {saveState === 'error' && saveError && (
          <div className="flex items-center space-x-2 text-red-600 text-sm font-medium animate-in fade-in-0 duration-300">
            <AlertCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      <RoomMixModal
        dealId={dealId}
        isOpen={roomMixOpen}
        onClose={() => setRoomMixOpen(false)}
        onSaved={handleRoomMixSaved}
      />
      
      <FacilitiesModal
        isOpen={facilitiesOpen}
        onClose={() => setFacilitiesOpen(false)}
        facilities={deal.amenities}
        onSave={handleFacilitiesSaved}
        hasRevenueConflicts={getRevenueConflicts()}
      />
    </div>
  );
}