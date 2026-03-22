/**
 * DESTINATION REGISTRY
 *
 * This is the ONLY file you need to modify when adding a new destination.
 *
 * To add a new city (e.g., Paris):
 * 1. Create src/data/destinations/paris.ts  (Destination object)
 * 2. Create src/data/itineraries/paris.ts   (ItineraryDay[] array)
 * 3. Create src/data/activities/paris.ts    (Activity[] array)
 * 4. Create src/data/products/paris.ts      (Product object)
 * 5. Import and register them below
 *
 * That's it. No new pages, components, or routes needed.
 */

import {
  Destination,
  ItineraryDay,
  Activity,
  Product,
  DestinationPageData,
} from '@/types';

// --- Tokyo ---
import { tokyo } from './destinations/tokyo';
import { tokyoItinerary } from './itineraries/tokyo';
import { tokyoActivities } from './activities/tokyo';
import { tokyoProduct } from './products/tokyo';

// ============================================================
// Registry maps — keyed by destination slug
// ============================================================

const destinations: Record<string, Destination> = {
  [tokyo.slug]: tokyo,
};

const itineraries: Record<string, ItineraryDay[]> = {
  [tokyo.slug]: tokyoItinerary,
};

const activities: Record<string, Activity[]> = {
  [tokyo.slug]: tokyoActivities,
};

const products: Record<string, Product> = {
  [tokyo.slug]: tokyoProduct,
};

// ============================================================
// Public API
// ============================================================

/** Get all registered destinations */
export function getAllDestinations(): Destination[] {
  return Object.values(destinations);
}

/** Get all destination slugs (for static generation) */
export function getAllSlugs(): string[] {
  return Object.keys(destinations);
}

/** Get a single destination by slug */
export function getDestination(slug: string): Destination | undefined {
  return destinations[slug];
}

/** Get itinerary for a destination */
export function getItinerary(slug: string): ItineraryDay[] {
  return itineraries[slug] ?? [];
}

/** Get activities for a destination */
export function getActivities(slug: string): Activity[] {
  return activities[slug] ?? [];
}

/** Get product for a destination */
export function getProduct(slug: string): Product | undefined {
  return products[slug];
}

/** Get fully-loaded page data for a destination */
export function getDestinationPageData(
  slug: string
): DestinationPageData | undefined {
  const destination = destinations[slug];
  const product = products[slug];
  if (!destination || !product) return undefined;

  return {
    destination,
    itinerary: itineraries[slug] ?? [],
    activities: activities[slug] ?? [],
    product,
  };
}
