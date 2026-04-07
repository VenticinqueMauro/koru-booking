# Pendientes — Koru Booking

## Flujo Ecommerce / Reservas pendientes

- [ ] **Estado "pendiente" para reservas en modo ecommerce** — actualmente las reservas creadas en `ecommerceMode` quedan en un estado ambiguo hasta que llega el webhook de pago aprobado. Cambios necesarios:
  - **DB**: agregar o reutilizar un estado `pending_payment` en el modelo `BookingReservation` (o `Booking`) para distinguir reservas esperando confirmación de pago
  - **Backoffice**: en la tabla de reservas/bookings, mostrar las que tienen `status: pending_payment` con un badge o indicador visual diferenciado (ej: "Pendiente de pago") en lugar de mostrarlas como confirmadas
  - **Backend**: el `WebhooksController` al recibir `payment_approved` debe transicionar el estado de `pending_payment` → `confirmed`; si llega `order_cancelled` debe pasar a `cancelled`
  - **UX**: evaluar si mostrar un contador de reservas pendientes en el dashboard del backoffice
