'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductAsset } from '@/types';

interface DeliveryData {
  destination: { name: string; slug: string };
  product: { name: string; description: string };
  assets: ProductAsset[];
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const destinationSlug = searchParams.get('destination');
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !destinationSlug) {
      setError('Invalid purchase session.');
      setLoading(false);
      return;
    }

    fetch(
      `/api/delivery/${destinationSlug}?session_id=${encodeURIComponent(
        sessionId
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load your purchase.');
        return res.json();
      })
      .then(setDelivery)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, destinationSlug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Loading your purchase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Oops</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
        >
          Back to Home
        </a>
      </div>
    );
  }

  if (!delivery) return null;

  const assetTypeIcons: Record<string, string> = {
    pdf: '📄',
    planner: '📋',
    checklist: '✅',
    map: '🗺️',
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          You&apos;re All Set!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Your {delivery.destination.name} travel plan is ready to download.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          {delivery.product.name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {delivery.product.description}
        </p>

        <div className="mt-6 space-y-3">
          {delivery.assets.map((asset, i) => (
            <a
              key={i}
              href={asset.path}
              download
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="text-2xl">
                {assetTypeIcons[asset.type] || '📁'}
              </span>
              <div>
                <div className="font-medium text-gray-900">{asset.label}</div>
                <div className="text-xs text-gray-500 uppercase">
                  {asset.type}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <a
          href={`/destination/${delivery.destination.slug}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          &larr; Back to {delivery.destination.name} guide
        </a>
      </div>
    </div>
  );
}
