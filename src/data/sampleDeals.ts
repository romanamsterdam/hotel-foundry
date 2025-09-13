import { Deal } from "../types/deal";
import { newId } from "../lib/dealStore";

export const sampleDeals: Deal[] = [
  {
    id: newId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Island Vibe Hotel",
    location: "Ibiza, Spain",
    address: "Avinguda d'Espanya 12, Ibiza",
    propertyType: "Boutique",
    stars: 4,
    gfaSqm: 4300,
    purchasePrice: 8_500_000,
    currency: "EUR",
    photoUrl: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2101f?w=1600&q=80&auto=format&fit=crop",
    roomTypes: [
      { id: "std", name: "Standard", rooms: 18, adrWeight: 100 },
      { id: "dlx", name: "Deluxe", rooms: 8, adrWeight: 120 },
      { id: "sui", name: "Suite", rooms: 2, adrWeight: 140 }
    ],
    amenities: {
      spa: false, pool: true, restaurant: true, bar: true,
      gym: true, meetingsEvents: false, parking: true, roomService: false
    },
    assumptions: {}
  },
  {
    id: newId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Cala Verde Retreat",
    location: "Mallorca, Spain",
    address: "Carrer del Mar 5, Deià",
    propertyType: "Boutique",
    stars: 4,
    gfaSqm: 3800,
    purchasePrice: 6_900_000,
    currency: "EUR",
    photoUrl: "https://images.unsplash.com/photo-1505692794403-34d4982b3a3a?w=1600&q=80&auto=format&fit=crop",
    roomTypes: [
      { id: "std", name: "Standard", rooms: 14, adrWeight: 100 },
      { id: "dlx", name: "Deluxe", rooms: 6, adrWeight: 125 },
      { id: "sui", name: "Suite", rooms: 2, adrWeight: 150 }
    ],
    amenities: {
      spa: false, pool: true, restaurant: true, bar: true,
      gym: false, meetingsEvents: false, parking: true, roomService: false
    },
    assumptions: {}
  }
];