"use client";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripeBrowser = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");
  }
  return stripePromise;
};

/**
 * Returns true when a real Stripe publishable key is configured.
 * The placeholder values (used in dev when env isn't set) start with
 * "pk_test_placeholder" — those should fall back to the demo flow.
 */
export const isStripeLive = (): boolean => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return Boolean(key && /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(key));
};
