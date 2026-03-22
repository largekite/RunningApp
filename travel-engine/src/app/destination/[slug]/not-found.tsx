import Link from 'next/link';

export default function DestinationNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900">
        Destination Not Found
      </h1>
      <p className="mt-4 text-gray-600">
        We don&apos;t have a travel plan for this destination yet. Check back
        soon — we&apos;re always adding new cities.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700"
      >
        Browse All Destinations
      </Link>
    </div>
  );
}
