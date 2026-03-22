import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getDestination, getProduct } from '@/data/registry';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination_slug, product_id } = body;

    if (!destination_slug || !product_id) {
      return NextResponse.json(
        { error: 'Missing destination_slug or product_id' },
        { status: 400 }
      );
    }

    const destination = getDestination(destination_slug);
    const product = getProduct(destination_slug);

    if (!destination || !product || product.id !== product_id) {
      return NextResponse.json(
        { error: 'Invalid destination or product' },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        product.stripe_price_id
          ? { price: product.stripe_price_id, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: product.price_cents,
                product_data: {
                  name: product.name,
                  description: product.description,
                },
              },
              quantity: 1,
            },
      ],
      metadata: {
        destination_slug: destination.slug,
        product_id: product.id,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&destination=${destination.slug}`,
      cancel_url: `${baseUrl}/destination/${destination.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
