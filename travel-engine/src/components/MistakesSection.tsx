import { DestinationMistake } from '@/types';

interface MistakesSectionProps {
  mistakes: DestinationMistake[];
  destinationName: string;
}

export function MistakesSection({
  mistakes,
  destinationName,
}: MistakesSectionProps) {
  return (
    <section id="mistakes" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-3xl font-bold text-gray-900">
        {mistakes.length} Mistakes Most {destinationName} Tourists Make
      </h2>
      <p className="mt-2 text-gray-600">
        Avoid these common pitfalls and travel like a local.
      </p>

      <div className="mt-10 space-y-6">
        {mistakes.map((mistake, index) => (
          <div
            key={index}
            className="rounded-xl border-l-4 border-red-400 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {mistake.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {mistake.description}
                </p>
                <div className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
                  <span className="font-semibold">Pro tip:</span>{' '}
                  {mistake.tip}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
