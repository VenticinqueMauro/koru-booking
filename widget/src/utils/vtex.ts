/**
 * VTEX Checkout integration utilities.
 *
 * Saves the koru-booking reservationId into localStorage under the
 * koru-triggers namespace. koru-triggers picks it up when the user reaches
 * the checkout page and writes it into the VTEX orderForm customData.
 *
 * This avoids the timing problem of trying to PUT to the orderForm on the PDP
 * (where the orderForm may not yet exist or may change before checkout).
 *
 * One-time store setup required (run once per VTEX account):
 *   POST https://{account}.myvtex.com/api/checkout/pub/orderForm/configuration
 *   Headers: X-VTEX-API-AppKey, X-VTEX-API-AppToken
 *   Body: { "apps": [{ "id": "koru-booking", "fields": ["reservationId"], "major": 1 }] }
 */

export const KORU_TRIGGERS_RESERVATION_KEY = 'koru-triggers:pending-reservation';

export interface PendingReservation {
  appSlug: string;
  reservationId: string;
}

/**
 * Saves the reservationId to localStorage so koru-triggers can sync it
 * to the VTEX orderForm when the user reaches checkout.
 */
export function saveReservationToVtexOrderForm(reservationId: string): boolean {
  try {
    const payload: PendingReservation = {
      appSlug: 'koru-booking',
      reservationId,
    };
    localStorage.setItem(KORU_TRIGGERS_RESERVATION_KEY, JSON.stringify(payload));
    console.log(`[koru-booking] reservationId "${reservationId}" saved to localStorage for checkout sync`);
    return true;
  } catch (err) {
    console.warn('[koru-booking] Could not save reservationId to localStorage:', err);
    return false;
  }
}
