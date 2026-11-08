export type ServiceId = 'mow' | 'mow_and_edge' | 'full_cleanup';

export type ServiceName = 'Mow' | 'Mow and Edge' | 'Full Cleanup';

export type AddonId = 'bag_clippings' | 'weed_treatment';

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined';

export interface LineItem {
  id: string;
  name: string;
  description: string;
  amount: number;
}

export interface Quote {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  customerName: string;
  lawnSizeSqFt: number;
  serviceType: ServiceName;
  servicePrice: number;
  addons: AddonId[];
  lineItems: LineItem[];
  totalAmount: number;
  status: QuoteStatus;
  clientNotes?: string;
  draftMessage?: string;
  createdAt: any;
  updatedAt: any;
}

export interface QuoteCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  lineItems: LineItem[];
  servicePrice: number;
  totalAmount: number;
}
