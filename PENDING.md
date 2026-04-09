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

- [ ] **Test end-to-end** — reserva → pago aprobado → webhook VTEX → confirmar booking → emails. Bloqueado en `catycanarnl1` por pasarela Talo. Repetir en tienda con pasarela estándar.
- [ ] **WebhookSecret en KoruSuite** — UI no renderiza el campo aún. Pendiente del equipo Koru.
- [ ] **Credenciales VTEX por tienda** — el Worker no tiene mecanismo para obtenerlas dinámicamente.

## DB — SQL ejecutado en Supabase ✓

La migración de `parentAccountId` fue ejecutada manualmente en Supabase el 2026-04-09.
