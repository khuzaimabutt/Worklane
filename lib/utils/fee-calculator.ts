/**
 * Fee math — ALWAYS use this. Never inline fee calculations elsewhere.
 * Reads rates from platform_settings (loaded once and cached).
 */

export interface PlatformSettings {
  seller_commission_rate: string;
  buyer_service_fee_rate: string;
  buyer_small_order_fee: string;
  buyer_small_order_threshold: string;
  [key: string]: string;
}

export interface OrderPricing {
  gigBasePrice: number;
  extrasPrice: number;
  orderSubtotal: number;
  buyerServiceFee: number;
  buyerSmallOrderFee: number;
  buyerTotalPaid: number;
  platformCommission: number;
  sellerEarnings: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateOrderPricing(
  gigBasePrice: number,
  extrasPrice: number = 0,
  settings: PlatformSettings
): OrderPricing {
  const orderSubtotal = round2(gigBasePrice + extrasPrice);

  const serviceFeeRate = parseFloat(settings.buyer_service_fee_rate);
  const smallOrderThreshold = parseFloat(settings.buyer_small_order_threshold);
  const smallOrderFeeAmount = parseFloat(settings.buyer_small_order_fee);
  const commissionRate = parseFloat(settings.seller_commission_rate);

  const buyerServiceFee = round2(orderSubtotal * serviceFeeRate);
  const buyerSmallOrderFee = orderSubtotal < smallOrderThreshold ? smallOrderFeeAmount : 0;
  const buyerTotalPaid = round2(orderSubtotal + buyerServiceFee + buyerSmallOrderFee);

  const platformCommission = round2(orderSubtotal * commissionRate);
  const sellerEarnings = round2(orderSubtotal - platformCommission);

  return {
    gigBasePrice: round2(gigBasePrice),
    extrasPrice: round2(extrasPrice),
    orderSubtotal,
    buyerServiceFee,
    buyerSmallOrderFee,
    buyerTotalPaid,
    platformCommission,
    sellerEarnings,
  };
}

/** Tips: platform keeps 20% commission, seller gets 80% */
export function calculateTipBreakdown(amount: number, settings: PlatformSettings) {
  const commissionRate = parseFloat(settings.seller_commission_rate);
  const platform = round2(amount * commissionRate);
  return {
    amount: round2(amount),
    platformCommission: platform,
    sellerAmount: round2(amount - platform),
  };
}

/** Default settings used as a fallback if DB load fails */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  seller_commission_rate: "0.20",
  buyer_service_fee_rate: "0.055",
  buyer_small_order_fee: "2.50",
  buyer_small_order_threshold: "50.00",
  clearing_days_new_seller: "14",
  clearing_days_level_one: "14",
  clearing_days_level_two: "10",
  clearing_days_top_rated: "7",
  auto_complete_days: "3",
  min_withdrawal_amount: "20.00",
  custom_offer_expiry_days: "7",
  level_one_min_orders: "10",
  level_one_min_earnings: "400",
  level_one_min_days: "60",
  level_two_min_orders: "50",
  level_two_min_earnings: "2000",
  level_two_min_days: "120",
  top_rated_min_orders: "100",
  top_rated_min_earnings: "20000",
};
