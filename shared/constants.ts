/**
 * ORCHID RETAIL PLATFORM — BUSINESS CONSTANTS
 * Centralized source of truth for business rules.
 */

export const SHIPPING = {
  /** Free shipping threshold (e.g., ₹999) */
  FREE_THRESHOLD: 999,
  
  /** Standard delivery charge (e.g., ₹69) */
  STANDARD_CHARGE: 69,
  
  /** Express delivery charge (e.g., ₹149) */
  EXPRESS_CHARGE: 149,
};

/**
 * Shared logic for calculating shipping charges.
 * Ensures frontend and backend are always in sync.
 */
export function calculateShippingCharge(subtotal: number, option: 'standard' | 'express' = 'standard', hasFreeShippingItem: boolean = false): number {
  if (option === 'express') {
    return SHIPPING.EXPRESS_CHARGE;
  }
  
  if (subtotal >= SHIPPING.FREE_THRESHOLD || hasFreeShippingItem) {
    return 0;
  }
  
  return SHIPPING.STANDARD_CHARGE;
}
