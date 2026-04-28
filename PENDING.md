# Pendientes — Koru Booking

## Completado

- [x] Reservas pendientes en backoffice — tab "Pendientes de pago" con TTL countdown y botón "Liberar slot"
- [x] Cache fix widget settings — `Cache-Control: no-store` en backend + `cache: 'no-store'` en fetch
- [x] Multi-store Phase 1 — jerarquía padre/hijo en `Account`, dualAuth resuelve al padre, syncKoruUser establece la jerarquía al login
- [x] **Endpoint `/api/reservations/match`** — server-to-server match por email/phone con normalización robusta

## Flujo ecommerce — end-to-end ✓ (sesión 2026-04-15)

Una compra VTEX con `payment-approved` confirma la reserva pending automáticamente.

Arquitectura completa en `koru-triggers/PENDING.md`. Resumen de lo que toca a koru-booking:

### Widget (ecommerceMode)
- Guarda `{"appSlug":"koru-booking","reservationId":"uuid"}` en `localStorage['koru-triggers:pending-reservation']`
- Dispara `window.dispatchEvent(new CustomEvent('koru:reservation-created', ...))`
- koru-triggers escucha el evento y sincroniza a `orderForm.marketingData.utmiPart` + `openTextField`

### Webhook (`/api/webhooks/ecommerce`)
Recibe eventos de koru-triggers (`payment_approved`, `order_cancelled`, `order_invoiced`). Si llega con `metadata.reservationId`, busca la reserva y la confirma/cancela.

### Match endpoint (`/api/reservations/match`) — fallback server-side
Usado por el Worker de koru-triggers cuando el sync client-side falla (cookies limpias, device switch, email ofuscado en OMS):
- Auth: `x-webhook-secret` — debe coincidir con `KORU_BOOKING_MATCH_SECRET` del Worker
- Matching robusto:
  - Email: `toLowerCase().trim()` + `mode: 'insensitive'`
  - Phone: últimos 8 dígitos (strip no-dígitos) con `contains` — tolera prefijos/formatos
- Logs detallados: `[Match] Query { ... }` y sample de reservas cuando no matchea

## Sprint 3 — UX admin booking ✓ (sesión 2026-04-16)

### Email ofuscado de VTEX — resuelto ✓
- [x] `WebhooksController.handlePaymentApproved`: invertida la prioridad en líneas 58-60 — ahora usa `reservation.customerEmail/Name/Phone` primero y el payload VTEX como fallback. El email real del cliente (ingresado en el widget) se preserva en el `Booking` confirmado.

### Teléfono obligatorio en widget — resuelto ✓
- [x] `CustomerForm.ts`: phone marcado como `required: true` (campo y validación HTML).
- [x] `handleSubmit`: valida que phone no esté vacío (error `required`) y luego formato (error `phone`).

### Fix routing backoffice — resuelto ✓
- [x] Eliminado artefacto de GitHub Pages: `backoffice/public/404.html` borrado (contenía link roto a `/koru-booking/`).
- [x] `api/client.ts` interceptor 401: reemplazado `window.location.href = \`${basename}/login\`` por `window.location.replace('/login')`.
- [x] `App.tsx`: agregada ruta catch-all `<Route path="*" element={<Navigate to="/" replace />} />` — evita "Redirecting..." page al refrescar cualquier ruta.

### Fix timezone en tabla Bookings — resuelto ✓
- [x] `parseDateLocal(isoString)`: construye `new Date(y, m-1, d)` en local midnight. Evita que `parseISO("2026-04-17T00:00:00.000Z")` se desplace al día anterior en zonas UTC-N (UTC-3 Argentina).
- [x] `isDatetimePast`: usa `dateStr.substring(0, 10)` directamente en comparación string — no depende de timezone.
- [x] Aplicado en todas las columnas de fecha de `Bookings.tsx` (tabla confirmed y pending).

### Visual "Pasada" en reservas vencidas — resuelto ✓
- [x] Filas con `isDatetimePast(booking.date, booking.time) === true` reciben `className="bg-muted/30 opacity-60"`.
- [x] Badge `<Clock> Pasada` debajo de la hora en la columna de fecha.

**Pendiente (post-Sprint 3)**: phone distinto al del checkout VTEX (typo, device switch).
  - Validar formato E.164 en el widget
  - Login/OTP pre-reserva para vincular phone verificado

## Sprint 3.6 — customerDocument en reservas ✓ (sesión 2026-04-28)

Agrega documento del cliente (DNI/CUIT) como campo opcional en el flujo de reserva
temporal. Permite matchear cuando el email de VTEX OMS llega ofuscado y el teléfono
no coincide (typo, device switch).

- [x] `schema.prisma`: `customerDocument String?` en `BookingReservation` — aplicado en Supabase vía SQL editor (`ALTER TABLE "BookingReservation" ADD COLUMN "customerDocument" TEXT`)
- [x] `backend/src/models/types.ts`: `customerDocument` en `CreateReservationSchema` (Zod, opcional)
- [x] `backend/src/controllers/ReservationsController.ts`: persiste `customerDocument` al crear + lo agrega como tercer matcher en `match()` (`customerDocument: { equals: document }`)
- [x] `widget/src/api/client.ts`: `customerDocument?: string` en `ReservationRequest`
- [x] `widget/src/components/CustomerForm.ts`: campo "Documento (DNI / CUIT)" opcional entre teléfono y notas
- [x] `widget/src/widget.ts`: envía `customerDocument: data.document || undefined` en `createReservation()`

**Nota DB**: migración ejecutada manualmente en Supabase (no via `prisma migrate dev` — usar SQL editor directo + `prisma generate` local).

## UI fixes widget ✓ (sesión 2026-04-28)

### Texto negro en fecha seleccionada — resuelto ✓
- [x] `widget/src/styles/widget.css`: agregado `color: white` a `.kb-day-card.kb-day-selected .kb-day-number`. El bug: `.kb-day-number` tenía `color: var(--kb-text-primary)` explícito que ganaba sobre el `color: white` heredado del estado selected; el selector específico no lo sobreescribía.

### Campo teléfono con prefijo "0" — resuelto ✓
- [x] `widget/src/components/CustomerForm.ts`: reemplazado el `createField('phone', ...)` genérico por `createPhoneField()` que renderiza un wrapper flex con "0" estático + input para el resto. `formData.phone = "0" + input.value`. El matching con VTEX no cambia (usa últimos 8 dígitos, strips non-digits). CSS: `.kb-phone-wrapper`, `.kb-phone-prefix`, `.kb-phone-input` en `widget.css`.

### Spinner al confirmar usa accentColor — resuelto ✓
- [x] `widget/src/widget.ts`: `showLoading()` tenía `border-top-color: #0d9488` hardcodeado. Ahora acepta `accentColor?: string` y lo aplica al spinner. Llamada actualizada: `this.showLoading(config.accentColor)`.

## Multi-store Phase 2 (pendiente de sesión anterior)

- [ ] **UI "Mis Tiendas" en backoffice** — listar websites del usuario con estado de vinculación padre/hijos
- [ ] **Overrides visuales por tienda** — `accentColor`, `triggerText`, `triggerPosition` por store hija, heredando resto del padre

## DB

La migración de `parentAccountId` fue ejecutada manualmente en Supabase el 2026-04-09.

## Variables de entorno (Vercel prod)

- `KORU_TRIGGERS_WEBHOOK_SECRET` = `86da1f095af56468925956c0745430145d7c45d619aad2cb20a4beda4bf7fa8f`
  - Mismo valor que `KORU_BOOKING_MATCH_SECRET` del Worker koru-triggers
  - Auth del endpoint `/api/reservations/match`
