# Koru Triggers — Guía de Integración para Apps

Este documento describe lo que cualquier app del ecosistema Koru debe implementar para trabajar en sincronía con **koru-triggers**.

koru-triggers actúa como un dispatcher centralizado: recibe webhooks de plataformas externas (VTEX, Shopify) y los reenvía a las apps registradas como `KoruEcommerceEvent`. La app registra su `webhookUrl` en la configuración de koru-triggers y se encarga de procesar los eventos.

---

## Arquitectura del flujo

```
Plataforma ecommerce (VTEX / Shopify)
  │
  │  webhook nativo (order_placed, payment_approved, etc.)
  ▼
Worker koru-triggers
  │  normaliza el evento → KoruEcommerceEvent
  │  Header: X-Koru-Triggers-Event: <type>
  ▼
Tu app (webhookUrl registrada en koru-triggers)
  │
  │  procesa el evento según type
  ▼
Resultado (confirmación, cancelación, notificación, etc.)
```

---

## 1. Registrar la app en koru-triggers

En la configuración de koru-triggers, registrá tu app con:

```json
{
  "name": "mi-app",
  "webhookUrl": "https://mi-app.vercel.app/api/webhooks/ecommerce",
  "events": ["payment_approved", "order_cancelled", "order_invoiced"]
}
```

El Worker enviará un POST a `webhookUrl` cada vez que ocurra un evento del tipo suscripto.

---

## 2. Implementar el endpoint receptor

### Ruta

```
POST /api/webhooks/ecommerce
```

No requiere auth del Widget (es llamado por el Worker, no por el browser). El header `X-Koru-Triggers-Event` identifica el tipo de evento para validación opcional.

### Estructura del evento (KoruEcommerceEvent)

```typescript
interface KoruEcommerceEvent {
  type: 'payment_approved' | 'order_cancelled' | 'order_invoiced';
  platform: 'vtex' | 'shopify';
  externalOrderId: string;     // ID del pedido en la plataforma
  timestamp: string;           // ISO 8601
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    externalProductId: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, string>; // datos custom pasados por el widget/checkout
  raw?: unknown;               // payload original de la plataforma
}
```

### Ejemplo de implementación mínima

```typescript
// POST /api/webhooks/ecommerce
app.post('/api/webhooks/ecommerce', async (req, res) => {
  const event: KoruEcommerceEvent = req.body;

  try {
    switch (event.type) {
      case 'payment_approved':
        await handlePaymentApproved(event);
        break;
      case 'order_cancelled':
        await handleOrderCancelled(event);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});
```

Siempre responder con `200` + `{ received: true }` antes de procesar lógica pesada para evitar timeouts en el Worker.

---

## 3. Vincular el estado interno con el evento

El campo clave para relacionar un evento con el estado interno de tu app es `metadata.reservationId` (o el identificador que uses).

### Patrón recomendado (Opción A — explícito)

1. Tu widget/frontend crea un recurso temporal antes del pago y recibe un ID:
   ```
   POST /api/reservations → { reservationId: "abc-123" }
   ```

2. El widget pasa ese ID al checkout de la plataforma como metadata del pedido (campo oculto, nota, custom data, etc.).

3. La plataforma incluye el dato en su webhook a koru-triggers.

4. koru-triggers lo reenvía en `metadata.reservationId`.

5. Tu endpoint lo usa para buscar el recurso en tu base de datos:
   ```typescript
   const reservationId = event.metadata?.reservationId;
   const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
   ```

### Fallback (Opción B — por orden)

Si `metadata.reservationId` no está disponible, buscar por `externalOrderId`. Solo usar como fallback — en producción siempre debería llegar el `reservationId`.

---

## 4. Cómo pasar el metadata por la plataforma

### VTEX

Guardar el `reservationId` en el `orderForm` como custom data antes de que el cliente finalice la compra:

```javascript
// En el frontend VTEX (checkout custom)
await fetch('/api/checkout/pub/orderForm/{orderFormId}/customData/koru/reservationId', {
  method: 'PUT',
  body: JSON.stringify({ value: reservationId }),
});
```

Esto queda en `order.customData.koru.reservationId` en el webhook de VTEX, que koru-triggers lo extrae y lo pone en `metadata`.

### Shopify

Usar `note_attributes` en el carrito:

```javascript
// En el frontend Shopify
fetch('/cart/update.js', {
  method: 'POST',
  body: JSON.stringify({
    note: reservationId,
    attributes: { reservationId },
  }),
});
```

---

## 5. Checklist de integración

- [ ] Endpoint `POST /api/webhooks/ecommerce` implementado y respondiendo `200`
- [ ] Maneja al menos `payment_approved` y `order_cancelled`
- [ ] Lee `metadata.reservationId` para vincular con estado interno
- [ ] Registrado en koru-triggers con `webhookUrl` correcto
- [ ] El widget/frontend pasa el ID del recurso al checkout antes del pago
- [ ] Lógica de fallback si `reservationId` no está en metadata
- [ ] Logs de warning cuando llega un evento sin reserva asociada

---

## Referencia: implementación en koru-booking

koru-booking es la implementación de referencia de esta integración:

| Componente | Archivo | Qué hace |
|---|---|---|
| Endpoint webhook | `backend/src/routes/webhooks.ts` | Recibe `KoruEcommerceEvent` |
| Lógica del webhook | `backend/src/controllers/WebhooksController.ts` | Confirma/cancela reservas |
| Recurso temporal | `backend/src/controllers/ReservationsController.ts` | Crea `BookingReservation` |
| Widget ecommerce | `widget/src/widget.ts` → `handleEcommerceReserve()` | Crea reserva, muestra estado temporal |
| Config backend | `backoffice/src/pages/Settings.tsx` | Toggle modo ecommerce + TTL |
| Modelo DB | `backend/prisma/schema.prisma` → `BookingReservation` | Estado de la reserva temporal |
