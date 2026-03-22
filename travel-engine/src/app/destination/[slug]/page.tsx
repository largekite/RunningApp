import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getDestinationPageData, getAllSlugs } from '@/data/registry';
import { HeroSection } from '@/components/HeroSection';
import { ItineraryTable } from '@/components/ItineraryTable';
import { DecisionTable } from '@/components/DecisionTable';
import { MistakesSection } from '@/components/MistakesSection';
import { CTASection } from '@/components/CTASection';

interface DestinationPageProps {
  params: { slug: string };
}

/** Generate static paths for all registered destinations */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/** Dynamic metadata from destination data */
export function generateMetadata({ params }: DestinationPageProps): Metadata {
  const data = getDestinationPageData(params.slug);
  if (!data) return { title: 'Destination Not Found' };

  return {
    title: data.destination.meta_title,
    description: data.destination.meta_description,
  };
}

export default function DestinationPage({ params }: DestinationPageProps) {
  const data = getDestinationPageData(params.slug);
  if (!data) notFound();

  const { destination, itinerary, product } = data;

  return (
    <>
      <HeroSection destination={destination} />

      <DecisionTable
        decisions={destination.decisions}
        destinationName={destination.name}
      />

      <ItineraryTable
        itinerary={itinerary}
        currency={destination.currency}
      />

      <MistakesSection
        mistakes={destination.mistakes}
        destinationName={destination.name}
      />

      <CTASection product={product} destination={destination} />
    </>
  );
}
