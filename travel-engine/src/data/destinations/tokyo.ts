import { Destination } from '@/types';

export const tokyo: Destination = {
  id: 'tokyo',
  slug: 'tokyo',
  name: 'Tokyo',
  country: 'Japan',
  continent: 'Asia',
  audience_type: ['families', 'couples', 'solo'],
  currency: 'JPY',
  language: 'Japanese',
  best_months: [3, 4, 5, 10, 11],
  tagline: 'The ultimate family-friendly guide to Tokyo — no stress, all magic.',
  description:
    'Tokyo is a city that seamlessly blends ancient temples with neon-lit streets, offering families an unforgettable mix of culture, food, and adventure. This plan gives you a day-by-day itinerary covering the best kid-friendly spots, hidden gems, and practical tips that most tourists miss.',
  hero_image: '/images/destinations/tokyo-hero.jpg',
  price_cents: 2900,
  stripe_price_id: undefined,
  itinerary_days: 7,
  mistakes: [
    {
      title: 'Buying a JR Pass without doing the math',
      description:
        'Many tourists buy the 7-day JR Pass assuming it saves money, but if you stay mostly in central Tokyo, a Suica/Pasmo IC card is far cheaper.',
      tip: 'Only get the JR Pass if you plan day trips to Hakone, Kamakura, or are taking the Shinkansen.',
    },
    {
      title: 'Skipping konbini (convenience stores)',
      description:
        'Visitors overlook 7-Eleven, Lawson, and FamilyMart, but Japanese konbini food is genuinely excellent and affordable.',
      tip: 'Try onigiri, egg sandwiches, and seasonal desserts. Great for quick kid-friendly meals.',
    },
    {
      title: 'Overloading the itinerary',
      description:
        'Tokyo is massive. Trying to see Shibuya, Asakusa, Akihabara, and Harajuku in one day means most of your time is spent on trains.',
      tip: 'Group activities by neighborhood. Our itinerary is designed to minimize transit.',
    },
    {
      title: 'Not carrying cash',
      description:
        'While Japan is modernizing payments, many small restaurants, temples, and vending machines are still cash-only.',
      tip: 'Withdraw yen from 7-Eleven ATMs (they accept international cards) and carry ¥10,000–¥20,000 daily.',
    },
    {
      title: 'Ignoring the etiquette basics',
      description:
        'Talking on phones in trains, tipping at restaurants, or wearing shoes in tatami areas can cause awkward moments.',
      tip: 'Learn 5 basic rules: no phone calls on trains, no tipping, remove shoes when asked, bow lightly, and queue patiently.',
    },
  ],
  decisions: [
    {
      question: 'When is the best time to visit Tokyo with kids?',
      answer:
        'Late March to mid-April (cherry blossom season) or October–November (autumn colors, mild weather). Avoid July–August (extreme humidity) and Golden Week (late April/early May — everything is packed).',
      icon: '🌸',
    },
    {
      question: 'How many days do we need?',
      answer:
        'A minimum of 5 days for central Tokyo. 7 days lets you add day trips to Hakone or Kamakura. Our plan covers 7 days with flexibility built in.',
      icon: '📅',
    },
    {
      question: 'Is Tokyo safe for families?',
      answer:
        'Extremely. Japan has one of the lowest crime rates in the world. Kids can safely ride trains, and you'll see young children commuting alone. Lost items are almost always returned.',
      icon: '🛡️',
    },
    {
      question: 'What about the language barrier?',
      answer:
        'Signs in major stations are bilingual. Google Translate's camera mode works well for menus. Most tourist areas have English-speaking staff. Download Google Translate's Japanese offline pack before you go.',
      icon: '🗣️',
    },
    {
      question: 'How expensive is Tokyo?',
      answer:
        'Tokyo can be surprisingly affordable. Budget ¥3,000–5,000/person/day for food (mix of konbini, ramen shops, and one sit-down meal). Transport: ¥1,000–1,500/day with IC card. Activities: many temples and parks are free.',
      icon: '💴',
    },
  ],
  meta_title: 'Tokyo Family Travel Plan — 7-Day Itinerary & Guide',
  meta_description:
    'The complete Tokyo family travel plan: 7-day itinerary, kid-friendly activities, common mistakes, and everything you need for a stress-free trip.',
};
