# Pendientes — Koru Booking

## Completado

- [x] Reservas pendientes en backoffice — tab "Pendientes de pago" con TTL countdown y botón "Liberar slot"
- [x] Cache fix widget settings — `Cache-Control: no-store` en backend + `cache: 'no-store'` en fetch
- [x] Multi-store Phase 1 — jerarquía padre/hijo en `Account`, dualAuth resuelve al padre, syncKoruUser establece la jerarquía al login

## Multi-store Phase 2 (pendiente)

- [ ] **UI "Mis Tiendas" en backoffice** — listar las websites del usuario con su estado de vinculación. Mostrar cuál es la cuenta padre y cuáles son instalaciones hijas.
- [ ] **Overrides visuales por tienda** — permitir que cada store hija tenga su propio `accentColor`, `triggerText` y `triggerPosition`, heredando el resto del padre. Requiere merge logic en `GET /settings`.

> **Nota**: el caso multi-store solo aplica cuando el merchant registra websites distintos en KoruSuite para el mismo dominio/tienda. En el flujo estándar (un website por tienda), backoffice y widget convergen en una sola cuenta automáticamente. Ver sección de integración en CLAUDE.md.

## Flujo Ecommerce

### Estado sesión 2026-04-15

**Lo que funciona:**
- [x] Widget en VTEX IO (PDP) guarda `reservationId` en `localStorage['koru-triggers:pending-reservation']` y dispara `koru:reservation-created`
- [x] koru-triggers escucha el evento y sincroniza al orderForm de VTEX via `openTextField` (`/api/checkout/pub/orderForm/{id}/attachments/openTextField`) — sin requerir configuración de Checkout Admin
- [x] Worker recibe webhook VTEX `payment-approved`, fetchea la orden OMS con credenciales VTEX, parsea `openTextField`
- [x] koru-booking backend recibe el evento de koru-triggers

**Bloqueado:**
- [ ] **`openTextField` no aparece en respuesta OMS** — el sync al orderForm retorna 200 y el log confirma éxito, pero el Worker no encuentra el campo en la respuesta de `/api/oms/pvt/orders/{id}`. Hipótesis: campo no incluido en OMS response, o RTK filtra el valor en logs locales. **Próxima sesión**: agregar `console.log` del raw order en el Worker para ver qué campos devuelve OMS.

**Descartado:**
- `customData` con app registration — requiere rol "Checkout Admin" (400 con OMS Full Access)
- PUT directo en PDP — no hay orderForm activo antes de add-to-cart
- Sync en checkout — VTEX checkout es página nativa (no IO), koru-triggers no carga ahí
- Escuchar `addToCart` via dataLayer/postMessage — dataLayer no existe en IO; solución final es custom event `koru:reservation-created`

**Integración del widget (`widget/src/utils/vtex.ts`):**
```
localStorage key: koru-triggers:pending-reservation
localStorage value: {"appSlug":"koru-booking","reservationId":"uuid"}
Custom event: window.dispatchEvent(new CustomEvent('koru:reservation-created', { detail: payload }))
```

- [ ] **WebhookSecret en KoruSuite** — UI no renderiza el campo aún. Pendiente del equipo Koru.
- [ ] **Credenciales VTEX por tienda** — el Worker usa secrets `VTEX_ACCOUNT_NAME/KEY/TOKEN` hardcodeados. Necesita mecanismo dinámico por tienda.

## DB — SQL ejecutado en Supabase ✓

La migración de `parentAccountId` fue ejecutada manualmente en Supabase el 2026-04-09.
