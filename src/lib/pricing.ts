export type GlobalOfferSettings = {
  enabled: boolean;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minItemPrice: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type PricingResult = {
  originalPrice: number;
  finalPrice: number;

  offerActive: boolean;

  offerName?: string;

  discountAmount: number;

  discountPercentage: number;
};

export function calculateProductPrice(
  originalPrice: number,
  settings: GlobalOfferSettings
): PricingResult {
  let finalPrice = originalPrice;

  let discountAmount = 0;

  let discountPercentage = 0;

  const now = new Date();

  const started =
    !settings.startsAt ||
    new Date(settings.startsAt) <= now;

  const notEnded =
    !settings.endsAt ||
    new Date(settings.endsAt) >= now;

  const offerActive =
    settings.enabled &&
    started &&
    notEnded &&
    originalPrice >= settings.minItemPrice;

  if (offerActive) {
    if (settings.type === "percentage") {
      discountAmount = Math.round(
        originalPrice * (settings.value / 100)
      );
    } else {
      discountAmount = settings.value;
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    finalPrice = originalPrice - discountAmount;

    discountPercentage = Math.round(
      (discountAmount / originalPrice) * 100
    );
  }

  return {
    originalPrice,

    finalPrice,

    offerActive,

    offerName: settings.name,

    discountAmount,

    discountPercentage,
  };
}