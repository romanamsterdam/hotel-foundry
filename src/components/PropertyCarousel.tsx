import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyTemplate } from '../types/property';
import PropertyCard from './PropertyCard';
import { safeArray } from '../lib/utils';

interface PropertyCarouselProps {
  properties?: PropertyTemplate[];
  title?: string;
  onSelect?: (property: PropertyTemplate) => void;
}

export default function PropertyCarousel({ properties = [], title, onSelect }: PropertyCarouselProps) {
  const safeProperties = safeArray(properties);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', 
    loop: false, 
    dragFree: false,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelectSnap = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelectSnap);
    onSelectSnap();
  }, [emblaApi, onSelectSnap]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi && emblaApi.scrollTo(i), [emblaApi]);

  const canScrollPrev = selectedIndex > 0;
  const canScrollNext = selectedIndex < scrollSnaps.length - 1;

  if (safeProperties.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <p className="text-xl text-slate-600 mb-4">No properties available</p>
          <p className="text-slate-500">Check back later for new property listings</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {title || 'Featured Properties'}
          </h2>
          <p className="text-slate-600">
            Curated selection of 15–40 room boutique hotels across premium European leisure markets.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            aria-label="Previous properties"
            onClick={scrollPrev}
            className="rounded-full border bg-white p-2 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next properties"
            onClick={scrollNext}
            className="rounded-full border bg-white p-2 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {safeProperties.map((property) => (
              <div
                key={property.id || property.slug || property.dealName}
                className="min-w-0 flex-[0_0_100%] pr-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%]"
              >
                <PropertyCard 
                  property={property} 
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile arrows (overlay) */}
        <div className="absolute inset-y-1/2 left-0 flex -translate-y-1/2 items-center md:hidden">
          <button
            aria-label="Previous properties"
            onClick={scrollPrev}
            className="ml-1 rounded-full border bg-white/90 p-2 shadow hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute inset-y-1/2 right-0 flex -translate-y-1/2 items-center md:hidden">
          <button
            aria-label="Next properties"
            onClick={scrollNext}
            className="mr-1 rounded-full border bg-white/90 p-2 shadow hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === selectedIndex ? 'bg-brand-600' : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </section>
  );
}