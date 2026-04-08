# Pendientes — Koru Booking

## Completado

- [x] Reservas pendientes en backoffice — tab "Pendientes de pago" con TTL countdown y botón "Liberar slot"
- [x] Cache fix widget settings — `Cache-Control: no-store` en backend + `cache: 'no-store'` en fetch
- [x] Multi-store Phase 1 — jerarquía padre/hijo en `Account`, dualAuth resuelve al padre, syncKoruUser establece la jerarquía al login

## Multi-store Phase 2 (pendiente)

- [ ] **UI "Mis Tiendas" en backoffice** — listar las websites del usuario con su estado de vinculación. Mostrar cuál es la cuenta padre y cuáles son instalaciones hijas.
- [ ] **Overrides visuales por tienda** — permitir que cada store hija tenga su propio `accentColor`, `triggerText` y `triggerPosition`, heredando el resto del padre. Requiere merge logic en `GET /settings`.

## Flujo Ecommerce

- [ ] **Test end-to-end** — reserva → pago aprobado → webhook VTEX → confirmar booking → emails. Bloqueado en `catycanarnl1` por pasarela Talo. Repetir en tienda con pasarela estándar.
- [ ] **WebhookSecret en KoruSuite** — UI no renderiza el campo aún. Pendiente del equipo Koru.
- [ ] **Credenciales VTEX por tienda** — el Worker no tiene mecanismo para obtenerlas dinámicamente.

## DB — SQL pendiente de ejecutar en Supabase

Correr en el SQL Editor de Supabase para activar la jerarquía multi-store:

```sql
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "parentAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "Account_parentAccountId_idx" ON "Account"("parentAccountId");

ALTER TABLE "Account" ADD CONSTRAINT IF NOT EXISTS "Account_parentAccountId_fkey"
  FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

Después de ejecutar el SQL, hacer logout + login en el backoffice para que `syncKoruUser` establezca la jerarquía automáticamente.
