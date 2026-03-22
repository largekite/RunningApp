import { getAllDestinations } from '@/data/registry';
import { DestinationCard } from '@/components/DestinationCard';

export default function HomePage() {
  const destinations = getAllDestinations();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Travel Plans That Actually Work
          </h1>
          <p className="mt-4 text-lg text-brand-200">
            Curated day-by-day itineraries with kid-friendliness ratings, budget
            breakdowns, and local tips. Buy once, download instantly.
          </p>
        </div>
      </section>

      {/* Destination grid */}
      <section id="destinations" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Destinations
        </h2>
        <p className="mt-2 text-gray-600">
          {destinations.length} destination
          {destinations.length !== 1 ? 's' : ''} available. More coming soon.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </section>
    </>
  );
}
