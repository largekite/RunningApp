'use client';

import { Product, Destination } from '@/types';
import { useState } from 'react';

interface CTASectionProps {
  product: Product;
  destination: Destination;
}

export function CTASection({ product, destination }: CTASectionProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_slug: destination.slug,
          product_id: product.id,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const priceDisplay = `$${(product.price_cents / 100).toFixed(
    product.price_cents % 100 === 0 ? 0 : 2
  )}`;

  return (
    <section
      id="pricing"
      className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Get Your {destination.name} Travel Plan
        </h2>
        <p className="mt-4 text-lg text-brand-200">{product.description}</p>

        <div className="mt-10 rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
          <ul className="space-y-3 text-left">
            {product.includes.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 text-green-400">&#10003;</span>
                <span className="text-brand-100">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-white/20 pt-8">
            <div className="text-5xl font-extrabold">{priceDisplay}</div>
            <p className="mt-1 text-sm text-brand-300">
              One-time purchase · Instant access
            </p>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 inline-flex items-center rounded-xl bg-white px-10 py-4 text-lg font-bold text-brand-900 shadow-lg transition hover:bg-brand-50 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting...' : `Buy ${destination.name} Plan`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
