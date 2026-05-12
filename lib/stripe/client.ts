import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return stripeInstance;
};
