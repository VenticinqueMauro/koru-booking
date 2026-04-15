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

## Pendientes UX — admin booking

### Email ofuscado de VTEX
VTEX devuelve emails anonimizados en OMS (`8a472a27487e4c4ca37242dd16786ca4@ct.vtex.com.br`). El admin de koru-booking muestra este string en la lista de bookings confirmadas (ver screenshot sesión 2026-04-15). **No sirve al admin del negocio.**

Opciones a evaluar:
- [ ] Cuando el webhook confirma una reserva, **preservar el email original** de la reserva pending (que sí es el real, ingresado por el usuario en el widget). No sobrescribirlo con el email VTEX.
- [ ] Si la confirmación crea un `Booking` nuevo distinto del `BookingReservation`, que el nuevo herede `customerEmail/customerPhone/customerName` de la reserva original, no del payload VTEX.
- [ ] Mostrar en UI "email registrado por el cliente" separado del "email de compra VTEX" cuando difieran.

**Crítico**: cualquier cambio acá NO debe romper el matching actual (Capa 3) que usa email + phone del OMS.

### Teléfono obligatorio en widget
Por ahora el phone-tail matching es el que salva el flujo cuando email viene ofuscado. Si el phone está vacío en la reserva, Capa 3 falla.

- [ ] **Marcar phone como required** en el formulario del widget (quick win).
- [ ] **Problema a resolver después**: el user puede cargar phone distinto al del checkout VTEX (typo, cambio de teléfono, compra desde otro device). Ideas:
  - Validar formato en el widget (regex argentino, normalizar a E.164)
  - Ofrecer login/OTP pre-reserva para vincular phone verificado
  - Matchear también por `document` (requiere añadir columna `customerDocument` al schema de `BookingReservation`)
  - Mostrar confirmación al user: "Reservaste con el teléfono X, el checkout usó Y, ¿confirmás que sos vos?"

## Multi-store Phase 2 (pendiente de sesión anterior)

- [ ] **UI "Mis Tiendas" en backoffice** — listar websites del usuario con estado de vinculación padre/hijos
- [ ] **Overrides visuales por tienda** — `accentColor`, `triggerText`, `triggerPosition` por store hija, heredando resto del padre

## DB

La migración de `parentAccountId` fue ejecutada manualmente en Supabase el 2026-04-09.

## Variables de entorno (Vercel prod)

- `KORU_TRIGGERS_WEBHOOK_SECRET` = `86da1f095af56468925956c0745430145d7c45d619aad2cb20a4beda4bf7fa8f`
  - Mismo valor que `KORU_BOOKING_MATCH_SECRET` del Worker koru-triggers
  - Auth del endpoint `/api/reservations/match`
