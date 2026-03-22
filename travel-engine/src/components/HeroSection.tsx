import { Destination } from '@/types';

interface HeroSectionProps {
  destination: Destination;
}

export function HeroSection({ destination }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">
          {destination.country} · {destination.continent}
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
          {destination.name}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto">
          {destination.tagline}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {destination.audience_type.map((audience) => (
            <span
              key={audience}
              className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
            >
              {audience.charAt(0).toUpperCase() + audience.slice(1)}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#pricing"
            className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-base font-bold text-brand-900 shadow-lg transition hover:bg-brand-50 hover:shadow-xl"
          >
            Get the {destination.itinerary_days}-Day Plan →
          </a>
        </div>
      </div>
    </section>
  );
}
