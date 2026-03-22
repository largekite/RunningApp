import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getProduct, getDestination } from '@/data/registry';

interface RouteParams {
  params: { productId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 403 }
      );
    }

    const destinationSlug = session.metadata?.destination_slug;
    if (!destinationSlug) {
      return NextResponse.json(
        { error: 'Invalid session metadata' },
        { status: 400 }
      );
    }

    const product = getProduct(destinationSlug);
    const destination = getDestination(destinationSlug);

    if (!product || !destination) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      destination: {
        name: destination.name,
        slug: destination.slug,
      },
      product: {
        name: product.name,
        description: product.description,
      },
      assets: product.assets,
    });
  } catch (error) {
    console.error('Delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}
