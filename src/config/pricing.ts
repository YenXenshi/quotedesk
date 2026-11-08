import { AddonId, LineItem, QuoteCalculationResult, ServiceId, ServiceName } from '../types/quote';

// ============================================================================
// QUOTEDESK PRICING CONFIGURATION
// Keep all rates, unit increments, and minimum charges in this single easy-to-edit list.
// ============================================================================
export const PRICING_CONFIG = {
  // Absolute minimum visit charge (no job goes out below this price)
  MINIMUM_JOB_CHARGE: 45.0,

  // Services offered: base includes up to baseSqFt; additional sq ft is billed per 1,000 sq ft
  SERVICES: {
    mow: {
      id: 'mow' as ServiceId,
      name: 'Mow' as ServiceName,
      shortDescription: 'Mow, trim walkways, blow clean',
      fullDescription: 'Precision cut at optimal turf height, string trimming around obstacles, and high-velocity leaf blower pathway cleanup.',
      basePrice: 45.0, // Minimum baseline charge
      includedSqFt: 3000,
      extraRatePer1000SqFt: 6.5, // Extra charge per 1,000 sq ft above 3,000 sq ft
      badge: 'Popular',
    },
    mow_and_edge: {
      id: 'mow_and_edge' as ServiceId,
      name: 'Mow and Edge' as ServiceName,
      shortDescription: 'Mow, hard vertical blade edging, blow clean',
      fullDescription: 'Full mowing service plus vertical metal blade trench edging along curbs, sidewalks, and driveways for crisp curb appeal.',
      basePrice: 60.0,
      includedSqFt: 3000,
      extraRatePer1000SqFt: 8.5,
      badge: 'Best Value',
    },
    full_cleanup: {
      id: 'full_cleanup' as ServiceId,
      name: 'Full Cleanup' as ServiceName,
      shortDescription: 'Mow, edge, hedge trim, bed blowdown & debris haul',
      fullDescription: 'Comprehensive premium property rejuvenation: mow & edge, hedge shaping up to 6ft, garden bed blowdown, and green waste haul.',
      basePrice: 110.0,
      includedSqFt: 3000,
      extraRatePer1000SqFt: 14.0,
      badge: 'Complete Care',
    },
  },

  // Optional add-ons
  ADDONS: {
    bag_clippings: {
      id: 'bag_clippings' as AddonId,
      name: 'Bag the clippings',
      shortDescription: 'Catch & haul off grass clippings',
      fullDescription: 'Collection and off-site recycling haul of all lawn clipping bags instead of mulching into turf.',
      flatFee: 15.0,
      extraRatePer1000SqFt: 2.5,
      includedSqFt: 3000,
    },
    weed_treatment: {
      id: 'weed_treatment' as AddonId,
      name: 'Weed treatment',
      shortDescription: 'Targeted eco spot spray & pre-emergent',
      fullDescription: 'Pet-friendly, selective broadleaf herbicide spot application and soil barrier pre-emergent protection.',
      flatFee: 25.0,
      extraRatePer1000SqFt: 3.5,
      includedSqFt: 3000,
    },
  },

  // Curated list of made-up customer names for quick one-tap owner drafting
  SAMPLE_CUSTOMER_NAMES: [
    'Jordan Miller',
    'Taylor Brooks',
    'Casey Morgan',
    'Morgan Riley',
    'Alex Green',
    'Jamie Vance',
    'River Bennett',
    'Riley Hayes',
    'Cameron Diaz-Cole',
    'Avery Sullivan',
    'Dakota Sterling',
    'Kendall Ross',
  ],
};

/**
 * Calculates line items and total strictly from business logic in code.
 * If lawnSizeSqFt is empty, 0, or negative, returns a friendly error message instead of a price.
 */
export function calculateQuote(
  lawnSizeSqFt: number | string | undefined | null,
  serviceKey: ServiceId,
  selectedAddons: AddonId[]
): QuoteCalculationResult {
  const numericSqFt = typeof lawnSizeSqFt === 'string' ? parseFloat(lawnSizeSqFt.replace(/,/g, '')) : Number(lawnSizeSqFt);

  if (!lawnSizeSqFt || isNaN(numericSqFt) || numericSqFt <= 0) {
    return {
      isValid: false,
      errorMessage: 'Please enter a positive lawn size in square feet (e.g. 4,500 sq ft) to see your instant quote.',
      lineItems: [],
      servicePrice: 0,
      totalAmount: 0,
    };
  }

  const lineItems: LineItem[] = [];
  const serviceDef = PRICING_CONFIG.SERVICES[serviceKey];

  if (!serviceDef) {
    return {
      isValid: false,
      errorMessage: 'Please select a valid service package.',
      lineItems: [],
      servicePrice: 0,
      totalAmount: 0,
    };
  }

  // 1. Calculate Base Service Price
  let servicePrice = serviceDef.basePrice;
  if (numericSqFt > serviceDef.includedSqFt) {
    const extraSqFt = numericSqFt - serviceDef.includedSqFt;
    const extraThousandSqFt = extraSqFt / 1000;
    const extraCharge = Math.round(extraThousandSqFt * serviceDef.extraRatePer1000SqFt * 100) / 100;
    servicePrice = Math.round((serviceDef.basePrice + extraCharge) * 100) / 100;
  }

  // Ensure minimum price guarantee
  servicePrice = Math.max(servicePrice, serviceDef.basePrice);

  lineItems.push({
    id: `service-${serviceDef.id}`,
    name: `${serviceDef.name} Service`,
    description: `${numericSqFt.toLocaleString()} sq ft property (${serviceDef.shortDescription})`,
    amount: servicePrice,
  });

  // 2. Calculate Add-ons (if selected)
  for (const addonId of selectedAddons) {
    const addonDef = PRICING_CONFIG.ADDONS[addonId];
    if (addonDef) {
      let addonPrice = addonDef.flatFee;
      if (numericSqFt > addonDef.includedSqFt) {
        const extraSqFt = numericSqFt - addonDef.includedSqFt;
        const extraThousandSqFt = extraSqFt / 1000;
        const extraCharge = Math.round(extraThousandSqFt * addonDef.extraRatePer1000SqFt * 100) / 100;
        addonPrice = Math.round((addonDef.flatFee + extraCharge) * 100) / 100;
      }
      lineItems.push({
        id: `addon-${addonDef.id}`,
        name: addonDef.name,
        description: addonDef.shortDescription,
        amount: addonPrice,
      });
    }
  }

  // 3. Calculate Total strictly from line items (never from typed numbers)
  const totalAmount = Math.round(lineItems.reduce((acc, item) => acc + item.amount, 0) * 100) / 100;

  return {
    isValid: true,
    lineItems,
    servicePrice,
    totalAmount,
  };
}

/**
 * Format currency nicely (e.g. $72.50)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
