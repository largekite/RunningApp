// ============================================================
// CORE DATA MODELS — Generic Travel Product Engine
// ============================================================

/** Audience segment the destination is tailored for */
export type AudienceType =
  | 'families'
  | 'couples'
  | 'solo'
  | 'backpackers'
  | 'luxury'
  | 'adventure';

/** Energy level for an activity block */
export type EnergyLevel = 'low' | 'medium' | 'high';

/** Time block within a day */
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

/** Activity category */
export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'culture'
  | 'nature'
  | 'shopping'
  | 'entertainment'
  | 'transport'
  | 'relaxation';

/** Activity tag for filtering */
export type ActivityTag =
  | 'indoor'
  | 'outdoor'
  | 'rainy-day'
  | 'kid-friendly'
  | 'budget'
  | 'splurge'
  | 'must-see'
  | 'hidden-gem'
  | 'photo-spot'
  | 'local-favorite';

// ============================================================
// Destination
// ============================================================
export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  continent: string;
  audience_type: AudienceType[];
  currency: string;
  language: string;
  best_months: number[];
  tagline: string;
  description: string;
  hero_image: string;
  /** Price in cents (USD) for the travel plan product */
  price_cents: number;
  /** Stripe Price ID (set after creating in Stripe dashboard) */
  stripe_price_id?: string;
  /** Number of days in the default itinerary */
  itinerary_days: number;
  /** Common mistakes tourists make */
  mistakes: DestinationMistake[];
  /** Key decision factors for choosing this destination */
  decisions: DestinationDecision[];
  /** SEO metadata */
  meta_title: string;
  meta_description: string;
}

export interface DestinationMistake {
  title: string;
  description: string;
  tip: string;
}

export interface DestinationDecision {
  question: string;
  answer: string;
  icon?: string;
}

// ============================================================
// Itinerary
// ============================================================
export interface ItineraryItem {
  id: string;
  destination_id: string;
  day_number: number;
  time_block: TimeBlock;
  activity_name: string;
  activity_id: string;
  duration_minutes: number;
  estimated_cost_cents: number;
  kid_score: 1 | 2 | 3 | 4 | 5;
  energy_level: EnergyLevel;
  notes?: string;
}

/** A day's itinerary grouped for display */
export interface ItineraryDay {
  day_number: number;
  title: string;
  items: ItineraryItem[];
}

// ============================================================
// Activity
// ============================================================
export interface Activity {
  id: string;
  destination_id: string;
  name: string;
  category: ActivityCategory;
  tags: ActivityTag[];
  average_duration_minutes: number;
  average_cost_cents: number;
  description: string;
  address?: string;
  tip?: string;
}

// ============================================================
// Product / Purchase
// ============================================================
export interface Product {
  id: string;
  destination_id: string;
  name: string;
  description: string;
  price_cents: number;
  stripe_price_id?: string;
  /** What the buyer gets */
  includes: string[];
  /** Downloadable asset paths (relative to /public) */
  assets: ProductAsset[];
}

export interface ProductAsset {
  type: 'pdf' | 'planner' | 'checklist' | 'map';
  label: string;
  path: string;
}

// ============================================================
// Aggregate type for a fully-loaded destination page
// ============================================================
export interface DestinationPageData {
  destination: Destination;
  itinerary: ItineraryDay[];
  activities: Activity[];
  product: Product;
}
