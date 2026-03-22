import { ItineraryDay, EnergyLevel } from '@/types';

interface ItineraryTableProps {
  itinerary: ItineraryDay[];
  currency: string;
}

const timeBlockColors: Record<string, string> = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-sky-100 text-sky-800',
  evening: 'bg-indigo-100 text-indigo-800',
};

const energyBadge: Record<EnergyLevel, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

function kidScoreStars(score: number) {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

function formatCost(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function ItineraryTable({ itinerary, currency }: ItineraryTableProps) {
  return (
    <section id="itinerary" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-3xl font-bold text-gray-900">
        Day-by-Day Itinerary
      </h2>
      <p className="mt-2 text-gray-600">
        {itinerary.length} days of activities, grouped by neighborhood to
        minimize transit time.
      </p>

      <div className="mt-10 space-y-10">
        {itinerary.map((day) => (
          <div key={day.day_number}>
            <h3 className="text-xl font-bold text-brand-800">
              Day {day.day_number}: {day.title}
            </h3>

            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Kid Score</th>
                    <th className="px-4 py-3">Energy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {day.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            timeBlockColors[item.time_block]
                          }`}
                        >
                          {item.time_block}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.activity_name}
                        </div>
                        {item.notes && (
                          <div className="mt-0.5 text-xs text-gray-500">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.duration_minutes} min
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.estimated_cost_cents === 0
                          ? 'Free'
                          : formatCost(item.estimated_cost_cents, currency)}
                      </td>
                      <td className="px-4 py-3 text-amber-500">
                        {kidScoreStars(item.kid_score)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            energyBadge[item.energy_level]
                          }`}
                        >
                          {item.energy_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
