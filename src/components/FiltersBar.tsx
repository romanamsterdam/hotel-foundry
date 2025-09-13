import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { X } from 'lucide-react';

export interface FilterState {
  country: string;
  minRooms: number;
  maxRooms: number;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  sortBy: string;
}

interface FiltersBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  properties: any[];
}

export default function FiltersBar({ filters, onFiltersChange, properties }: FiltersBarProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice / 1000000, filters.maxPrice / 1000000]);
  const [roomRange, setRoomRange] = useState([filters.minRooms, filters.maxRooms]);

  // Calculate dynamic ranges from properties
  const { minRooms, maxRooms, minPrice, maxPrice } = React.useMemo(() => {
    if (properties.length === 0) {
      return { minRooms: 10, maxRooms: 50, minPrice: 1000000, maxPrice: 20000000 };
    }
    
    const rooms = properties.map(p => p.roomsTotal || 0);
    const prices = properties.map(p => p.purchasePrice || 0).filter(p => p > 0);
    
    return {
      minRooms: Math.min(...rooms),
      maxRooms: Math.max(...rooms),
      minPrice: prices.length > 0 ? Math.min(...prices) : 1000000,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 20000000
    };
  }, [properties]);

  // Update ranges when properties change
  React.useEffect(() => {
    setPriceRange([minPrice / 1000000, maxPrice / 1000000]);
    setRoomRange([minRooms, maxRooms]);
  }, [minPrice, maxPrice, minRooms, maxRooms]);

  const countries = ['All Countries', 'Spain', 'Portugal', 'Italy'];
  const propertyTypes = ['All Types', 'Boutique Hotel', 'Villa Hotel', 'Beachfront Hotel', 'Historic Palace Hotel', 'Agriturismo', 'Trullo Resort'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'priceAsc', label: 'Price: Low → High' },
    { value: 'priceDesc', label: 'Price: High → Low' },
    { value: 'roomsAsc', label: 'Rooms: Low → High' },
    { value: 'roomsDesc', label: 'Rooms: High → Low' }
  ];

  const handleCountryChange = (value: string) => {
    onFiltersChange({ ...filters, country: value });
  };

  const handlePropertyTypeChange = (value: string) => {
    onFiltersChange({ ...filters, propertyType: value });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    onFiltersChange({
      ...filters,
      minPrice: value[0] * 1000000,
      maxPrice: value[1] * 1000000
    });
  };

  const handleRoomRangeChange = (value: number[]) => {
    setRoomRange(value);
    onFiltersChange({
      ...filters,
      minRooms: value[0],
      maxRooms: value[1]
    });
  };

  const clearFilters = () => {
    const defaultFilters = {
      country: 'All Countries',
      minRooms,
      maxRooms,
      minPrice,
      maxPrice,
      propertyType: 'All Types',
      sortBy: 'newest'
    };
    setPriceRange([1, 20]);
    setRoomRange([10, 50]);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return filters.country !== 'All Countries' ||
           filters.propertyType !== 'All Types' ||
           filters.minRooms !== minRooms ||
           filters.maxRooms !== maxRooms ||
           filters.minPrice !== minPrice ||
           filters.maxPrice !== maxPrice ||
           filters.sortBy !== 'newest';
  };

  return (
    <div className="p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Country</label>
            <Select value={filters.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Property Type</label>
            <Select value={filters.propertyType} onValueChange={handlePropertyTypeChange}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sort By</label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Rooms: {Math.round(roomRange[0])} - {Math.round(roomRange[1])}
            </label>
            <Slider
              value={roomRange}
              onValueChange={handleRoomRangeChange}
              max={maxRooms}
              min={minRooms}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Price: €{priceRange[0].toFixed(1)}M - €{priceRange[1].toFixed(1)}M
            </label>
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={maxPrice / 1000000}
              min={minPrice / 1000000}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        {hasActiveFilters() && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Active filters:</span>
              <div className="flex items-center space-x-2">
                {filters.country !== 'All Countries' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>{filters.country}</span>
                  </Badge>
                )}
                {filters.propertyType !== 'All Types' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>{filters.propertyType}</span>
                  </Badge>
                )}
                {filters.sortBy !== 'newest' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>{sortOptions.find(opt => opt.value === filters.sortBy)?.label}</span>
                  </Badge>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Clear all</span>
            </Button>
          </div>
        )}
    </div>
  );
}