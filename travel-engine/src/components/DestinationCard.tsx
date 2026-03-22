import Link from 'next/link';
import { Destination } from '@/types';

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  const price = `$${(destination.price_cents / 100).toFixed(
    destination.price_cents % 100 === 0 ? 0 : 2
  )}`;

  return (
    <Link
      href={`/destination/${destination.slug}`}
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white">
        <h3 className="text-2xl font-bold">{destination.name}</h3>
        <p className="mt-1 text-sm text-brand-200">
          {destination.country} · {destination.continent}
        </p>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 line-clamp-2">
          {destination.tagline}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {destination.audience_type.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
              >
                {a}
              </span>
            ))}
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-brand-700">{price}</span>
            <p className="text-xs text-gray-400">
              {destination.itinerary_days}-day plan
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm font-medium text-brand-600 group-hover:text-brand-800">
          View plan &rarr;
        </div>
      </div>
    </Link>
  );
}
