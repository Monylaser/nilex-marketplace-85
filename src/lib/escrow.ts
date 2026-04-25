// Escrow helpers: eligibility & commission calculation

export const ESCROW_ELIGIBLE_SLUGS = ["cars", "real-estate"];

export const isEscrowEligible = (categorySlug?: string | null) =>
  !!categorySlug && ESCROW_ELIGIBLE_SLUGS.includes(categorySlug);

/**
 * Commission tiers based on seller verification level.
 * - Level 0/1: 5%   (standard)
 * - Level 2:   3%   (verified)
 * - Level 3:   2%   (VIP)
 * - Level 4:   2%   (business)
 * Capped at 2000 EGP.
 */
export const COMMISSION_CAP = 2000;

export const commissionRateFor = (verificationLevel?: number | null): number => {
  const lvl = verificationLevel ?? 0;
  if (lvl >= 3) return 2;
  if (lvl === 2) return 3;
  return 5;
};

export const computeCommission = (amount: number, rate: number) => {
  const raw = (amount * rate) / 100;
  return Math.min(raw, COMMISSION_CAP);
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Payment confirmed",
  shipped: "Shipped by seller",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
  refunded: "Refunded",
};
