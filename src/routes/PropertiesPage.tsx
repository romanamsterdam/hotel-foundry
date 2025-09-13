import React, { useState, useEffect, useMemo } from 'react';
import { Section } from '../components/ui/section';
import PropertyCard from '../components/PropertyCard';
import FiltersBar, { FilterState } from '../components/FiltersBar';
import { selectors } from '../lib/templatesStore';
import { PropertyTemplate } from '../types/property';

export default function PropertiesPage() {
  const [filters, setFilters] = useState<FilterState>({
    country: 'All Countries',
    minRooms: 0,
    maxRooms: 100,
    minPrice: 0,
    maxPrice: 50000000,
    propertyType: 'All Types',
    sortBy: 'newest'
  });

  // Get properties from templates store - memoized to prevent infinite re-renders
  const templateProperties: PropertyTemplate[] = useMemo(() => selectors.forGallery(), []);
  
  // Initialize filters with dynamic ranges
  useEffect(() => {
    if (templateProperties.length > 0) {
      const rooms = templateProperties.map(p => p.roomsTotal || 0);
      const prices = templateProperties.map(p => p.purchasePrice || 0).filter(p => p > 0);
      
      const minRooms = Math.min(...rooms);
      const maxRooms = Math.max(...rooms);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 1000000;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 20000000;
      
      setFilters(prev => ({
        ...prev,
        minRooms,
        maxRooms,
        minPrice,
        maxPrice
      }));
    }
  }, [templateProperties]);
  
  const filteredAndSortedProperties = useMemo(() => {
    // Filter properties
    const filtered = templateProperties.filter((property: PropertyTemplate) => {
      // Country filter
      if (filters.country !== 'All Countries' && property.country !== filters.country) {
        return false;
      }

      // Room count filter
      if ((property.roomsTotal || 0) < filters.minRooms || (property.roomsTotal || 0) > filters.maxRooms) {
        return false;
      }

      // Price filter
      if ((property.purchasePrice || 0) < filters.minPrice || (property.purchasePrice || 0) > filters.maxPrice) {
        return false;
      }

      // Property type filter
      if (filters.propertyType !== 'All Types' && property.propertyType !== filters.propertyType) {
        return false;
      }

      return true;
    });
    
    // Sort properties
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priceAsc':
          return (a.purchasePrice || 0) - (b.purchasePrice || 0);
        case 'priceDesc':
          return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        case 'roomsAsc':
          return (a.roomsTotal || 0) - (b.roomsTotal || 0);
        case 'roomsDesc':
          return (b.roomsTotal || 0) - (a.roomsTotal || 0);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [templateProperties, filters]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Property Gallery
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Curated collection of boutique hotel investment opportunities across European leisure markets.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <div className="sticky top-16 z-40 bg-white rounded-lg border border-slate-200 shadow-sm">
            <FiltersBar filters={filters} onFiltersChange={setFilters} properties={templateProperties} />
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <p className="text-slate-600">
              Showing {filteredAndSortedProperties.length} of {templateProperties.length} properties
            </p>
          </div>
        
          {filteredAndSortedProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-slate-600 mb-4">No properties match your filters</p>
              <p className="text-slate-500">Try adjusting your search criteria to see more results</p>
            </div>
          )}
          </div>
      </section>
    </div>
  );
}