import { Product } from '@/types';

export const tokyoProduct: Product = {
  id: 'product-tokyo-family-plan',
  destination_id: 'tokyo',
  name: 'Tokyo Family Travel Plan',
  description:
    'The complete 7-day Tokyo family itinerary — day-by-day schedule, kid-friendly activities, budget breakdowns, and printable planner.',
  price_cents: 2900,
  stripe_price_id: undefined,
  includes: [
    '7-day detailed itinerary with times and costs',
    'Kid-friendliness ratings for every activity',
    'Neighborhood-grouped schedule (minimal transit)',
    'Printable daily planner sheets',
    'Common mistakes guide with local tips',
    'Offline PDF — no internet needed',
  ],
  assets: [
    {
      type: 'pdf',
      label: 'Tokyo 7-Day Itinerary (PDF)',
      path: '/downloads/tokyo/tokyo-itinerary.pdf',
    },
    {
      type: 'planner',
      label: 'Tokyo Daily Planner (Printable)',
      path: '/downloads/tokyo/tokyo-planner.pdf',
    },
    {
      type: 'checklist',
      label: 'Tokyo Packing Checklist',
      path: '/downloads/tokyo/tokyo-checklist.pdf',
    },
  ],
};
