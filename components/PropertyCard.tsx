import { MapPin, Bed, Star, Utensils, Waves, Calendar, Car, Dumbbell, Coffee, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PropertyTemplate } from '../types/property';
import { formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getInitials, asStr, safeLocation } from '../lib/strings';
import { facilityLabel, facilityKey } from '../lib/deals/normalizers';

interface PropertyCardProps {
  property: PropertyTemplate;
  onSelect?: (property: PropertyTemplate) => void;
}

export default function PropertyCard({ property, onSelect }: PropertyCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    dealName,
    city,
    country,
    photoUrl,
    stars,
    roomsTotal,
    facilities,
    featured,
    purchasePrice,
    currency,
    propertyType
  } = property;

  const initials = getInitials(dealName, 'P');

  const hasPhoto = Boolean(asStr(photoUrl).trim().length > 0);
  const facilitiesSafe = Array.isArray(facilities) ? facilities.filter(Boolean) : [];
  const location = safeLocation(city, country);

  const getFacilityIcons = () => {
    const icons = [];
    facilitiesSafe.forEach(facility => {
      const facilityStr = facilityLabel(facility);
      switch (facilityStr) {
        case 'Pool': icons.push({ icon: Waves, label: 'Pool' }); break;
        case 'Restaurant': icons.push({ icon: Utensils, label: 'Restaurant' }); break;
        case 'Bar': icons.push({ icon: Coffee, label: 'Bar' }); break;
        case 'Spa': icons.push({ icon: Sparkles, label: 'Spa' }); break;
        case 'Parking': icons.push({ icon: Car, label: 'Parking' }); break;
        case 'Gym': icons.push({ icon: Dumbbell, label: 'Gym' }); break;
        case 'MeetingRoom': icons.push({ icon: Calendar, label: 'M&E' }); break;
        case 'Beach': icons.push({ icon: Waves, label: 'Beach' }); break;
        default: break;
      }
    });
    return icons.slice(0, 5); // Show max 5 icons
  };

  const handleUnderwriteClick = () => {
    if (onSelect) {
      onSelect(property);
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/membership');
    }
  };

  return (
    <Card className="group overflow-hidden border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <div className="relative overflow-hidden">
        {hasPhoto ? (
          <img
            src={photoUrl}
            alt={dealName}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold text-2xl">
            {initials}
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-slate-800">
            {propertyType}
          </Badge>
        </div>
        {stars && (
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
            {[...Array(stars)].map((_, i) => (
              <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
            ))}
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{asStr(dealName, 'Untitled Property')}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mb-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {location}
              </div>
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {roomsTotal || 0} room{(roomsTotal || 0) !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">
              {purchasePrice ? formatCurrency(purchasePrice, currency || 'EUR') : 'Price on request'}
            </div>
          </div>

          {featured && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-center">
                <Badge className="bg-yellow-100 text-yellow-700">Featured Property</Badge>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {getFacilityIcons().map(({ icon: Icon, label }, index) => (
              <div key={index} className="flex items-center space-x-1 text-slate-500 text-xs" title={label}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleUnderwriteClick} className="w-full bg-slate-900 hover:bg-slate-800">
            Underwrite this Deal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}