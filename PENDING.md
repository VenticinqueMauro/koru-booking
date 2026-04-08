# Pendientes — Koru Booking

## Estilos y configuración visual

- [x] **Cambios de estilos/colores no se reflejan en la tienda** — fix aplicado: `Cache-Control: no-store` en `GET /settings` (backend) y `cache: 'no-store'` en el fetch del widget.

## Flujo Ecommerce / Reservas pendientes

- [x] **Reservas pendientes en backoffice** — implementado: tab "Pendientes de pago" en Bookings con TTL countdown, badge contador en el tab, y botón "Liberar slot". Backend expone `GET /reservations` con reservas `pending` y `expiresAt > now`.
