import { DestinationDecision } from '@/types';

interface DecisionTableProps {
  decisions: DestinationDecision[];
  destinationName: string;
}

export function DecisionTable({
  decisions,
  destinationName,
}: DecisionTableProps) {
  return (
    <section id="decisions" className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Should You Visit {destinationName}?
        </h2>
        <p className="mt-2 text-gray-600">
          Key questions answered so you can decide with confidence.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {decisions.map((decision, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {decision.icon && (
                  <span className="text-2xl">{decision.icon}</span>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {decision.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {decision.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
