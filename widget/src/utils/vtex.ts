/**
 * VTEX Checkout integration utilities.
 *
 * Saves the koru-booking reservationId into the VTEX orderForm customData so
 * that when the order is placed and payment is approved, the koru-triggers
 * Worker can read it and confirm the reservation.
 *
 * One-time store setup required (run once per VTEX account):
 *   POST https://{account}.myvtex.com/api/checkout/pub/orderForm/configuration
 *   Headers: X-VTEX-API-AppKey, X-VTEX-API-AppToken
 *   Body: { "apps": [{ "id": "koru-booking", "fields": ["reservationId"], "major": 1 }] }
 */

const VTEX_APP_ID = 'koru-booking';
const VTEX_FIELD = 'reservationId';

function getStoreOrigin(): string | null {
  const { hostname, origin } = window.location;
  if (
    hostname.includes('.myvtex.com') ||
    hostname.includes('.vtexcommercestable.com.br') ||
    hostname.includes('.vtexcommercebeta.com.br')
  ) {
    return origin;
  }
  return null;
}

async function getOrderFormId(): Promise<string | null> {
  // 1. vtexjs native object (available when checkout.js is loaded)
  const vtexjs = (window as any).vtexjs;
  if (vtexjs?.checkout?.orderFormId) {
    return vtexjs.checkout.orderFormId as string;
  }

  // 2. checkout.vtex.com cookie
  const cookie = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('checkout.vtex.com='));
  if (cookie) {
    try {
      const raw = decodeURIComponent(cookie.split('=').slice(1).join('='));
      const parsed = JSON.parse(raw);
      if (parsed.orderFormId) return parsed.orderFormId as string;
    } catch {
      // ignore
    }
  }

  // 3. Public orderForm endpoint
  const origin = getStoreOrigin();
  if (!origin) return null;

  try {
    const res = await fetch(`${origin}/api/checkout/pub/orderForm`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json() as { orderFormId?: string };
      return data.orderFormId ?? null;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Saves the reservationId into the current VTEX orderForm's customData.
 * Returns true on success, false if not in a VTEX context or if the call fails.
 * Failure is non-fatal — the reservation is still created; it just won't be
 * auto-confirmed when payment is approved.
 */
export async function saveReservationToVtexOrderForm(reservationId: string): Promise<boolean> {
  const origin = getStoreOrigin();
  if (!origin) return false;

  const orderFormId = await getOrderFormId();
  if (!orderFormId) {
    console.warn('[koru-booking] Could not get VTEX orderFormId — reservationId will not be saved to cart');
    return false;
  }

  try {
    const url = `${origin}/api/checkout/pub/orderForm/${orderFormId}/customData/${VTEX_APP_ID}/${VTEX_FIELD}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: reservationId }),
    });

    if (res.ok) {
      console.log(`[koru-booking] reservationId "${reservationId}" saved to VTEX orderForm ${orderFormId}`);
      return true;
    }

    console.warn(`[koru-booking] Failed to save reservationId to VTEX orderForm: ${res.status}`);
    return false;
  } catch (err) {
    console.warn('[koru-booking] Error saving reservationId to VTEX orderForm:', err);
    return false;
  }
}
