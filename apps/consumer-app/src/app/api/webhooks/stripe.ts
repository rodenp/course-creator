import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma'; // Assuming @ refers to apps/consumer-app/src

// Initialize Stripe Node.js SDK
// Ensure STRIPE_SECRET_KEY is set in your .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // Use a fixed API version
  typescript: true,
});

// Ensure STRIPE_WEBHOOK_SECRET is set in your .env file
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to map Stripe Price ID to your internal plan IDs
// TODO: This should ideally come from a database table or a more robust config
function mapStripePriceIdToInternalPlanId(stripePriceId: string): string {
  const mapping: { [key: string]: string } = {
    // Example: fill these with your actual Stripe Price IDs and corresponding internal plan names
    // 'price_xxxxxxxxxxxxxxx1': 'basic',
    // 'price_xxxxxxxxxxxxxxx2': 'pro',
    // 'price_xxxxxxxxxxxxxxx3': 'enterprise',
  };
  // A default or error handling if price ID is not recognized
  const internalPlan = mapping[stripePriceId];
  if (!internalPlan) {
    console.warn(`No internal plan ID found for Stripe Price ID: ${stripePriceId}. Defaulting to 'unknown_plan'.`);
    return 'unknown_plan';
  }
  return internalPlan;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not set in environment variables.");
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
   if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Stripe secret key is not set in environment variables.");
    return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook error: ${errorMessage}` }, { status: 400 });
  }

  console.log(`Received Stripe event: type=${event.type}, id=${event.id}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          const stripeSubscriptionId = session.subscription as string;
          const stripeCustomerId = session.customer as string;
          // client_reference_id should be your internal User ID, passed when creating the checkout session
          const userId = session.client_reference_id;

          if (!userId) {
            console.error('Checkout session completed without client_reference_id (userId). Cannot link subscription.');
            // Optionally, try to find user by email if session.customer_details.email exists
            // const userEmail = session.customer_details?.email;
            // if (userEmail) { /* ... find user by email ... */ }
            break;
          }

          const subscriptionDetails = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const priceId = subscriptionDetails.items.data[0]?.price.id;
          const internalPlanId = priceId ? mapStripePriceIdToInternalPlanId(priceId) : 'unknown_plan';

          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubscriptionId,
              stripeCustomerId,
              planId: internalPlanId,
              status: subscriptionDetails.status,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId,
              stripeCustomerId,
              planId: internalPlanId,
              status: subscriptionDetails.status,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
            },
          });
          console.log(`Subscription for user ${userId} (plan: ${internalPlanId}) created/updated via checkout.`);
        } else if (session.mode === 'payment') {
          console.log('One-time payment checkout session completed:', session.id);
          // Add logic here if your app supports direct course purchases not via subscription
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const internalPlanId = priceId ? mapStripePriceIdToInternalPlanId(priceId) : 'unknown_plan';

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            planId: internalPlanId,
            status: subscription.status,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            // canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          },
        });
        console.log(`Subscription ${subscription.id} updated. Plan: ${internalPlanId}, Status: ${subscription.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            // canceledAt: new Date(subscription.canceled_at! * 1000), // if available and needed
          },
        });
        console.log(`Subscription ${subscription.id} canceled.`);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const stripeSubscriptionId = invoice.subscription as string;
          const subscriptionDetails = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          await prisma.subscription.update({
            where: { stripeSubscriptionId },
            data: {
              status: subscriptionDetails.status,
              stripeCurrentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
            },
          });
          console.log(`Invoice payment succeeded for subscription ${stripeSubscriptionId}. Status updated.`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: 'past_due' },
          });
          console.log(`Invoice payment failed for subscription ${invoice.subscription}. Status set to past_due.`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during event processing';
    console.error(`Error processing Stripe event ${event.id} (type: ${event.type}): ${errorMessage}`);
    return NextResponse.json({ error: 'Webhook event processing failed.', details: errorMessage }, { status: 500 });
  }
}
