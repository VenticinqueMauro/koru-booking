# Plan de Integracion: Koru Booking + VTEX (Camino B)

> **Objetivo**: Embeber el sistema de reservas en la PDP de una tienda VTEX, permitiendo al cliente ver disponibilidad y agendar antes de comprar. La reserva se confirma al concretarse el pago en VTEX.

> **Restriccion clave**: Esta integracion debe ser un camino **condicional y opcional**. La app debe seguir funcionando de forma independiente. El diseno debe contemplar una **capa de integracion pluggable** para soportar otros ecommerces en el futuro (Shopify, WooCommerce, etc.).

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    VTEX Storefront (PDP)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  booking-widget (React Block - VTEX IO App)         │    │
│  │  - Lee productId del contexto de producto           │    │
│  │  - Consulta mapeo producto → servicio               │    │
│  │  - Muestra selector de fecha/hora (slots)           │    │
│  │  - Guarda slot seleccionado en orderForm            │    │
│  └──────────────┬──────────────────────────────────────┘    │
│                 │                                           │
│                 ▼                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  VTEX IO Service (Node.js - proxy + eventos)        │    │
│  │  - GET  /_v/booking/slots/:serviceId?date=          │    │
│  │  - POST /_v/booking/reserve (reserva temporal)      │    │
│  │  - Event: payment-approved → confirma reserva       │    │
│  └──────────────┬──────────────────────────────────────┘    │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Koru Booking Backend (existente)                │
│                                                             │
│  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │  Capa de Integracion         │  │  Core (sin cambios)  │ │
│  │  (nuevo modulo pluggable)    │  │  - SlotCalculator    │ │
│  │                              │  │  - ConflictValidator │ │
│  │  POST /api/integrations/     │  │  - BookingsController│ │
│  │       ecommerce/reserve      │  │  - EmailService      │ │
│  │  POST /api/integrations/     │  │                      │ │
│  │       ecommerce/confirm      │  │                      │ │
│  │  POST /api/integrations/     │  │                      │ │
│  │       ecommerce/cancel       │  │                      │ │
│  │  GET  /api/integrations/     │  │                      │ │
│  │       ecommerce/mappings     │  │                      │ │
│  └──────────────────────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Nuevos modelos Prisma                               │   │
│  │  - EcommerceIntegration (config por account)         │   │
│  │  - ProductServiceMapping (producto → servicio)       │   │
│  │  - BookingReservation (reservas temporales con TTL)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Diseno de la Capa de Integracion (Backend)

### 2.1 Principio: Provider Pattern

La integracion se disena con un **patron de proveedores** para que agregar un nuevo ecommerce sea implementar una interfaz, no modificar el core.

```
backend/src/
├── services/                    # Core existente (sin tocar)
│   ├── SlotCalculator.ts
│   ├── ConflictValidator.ts
│   └── EmailService.ts
│
├── integrations/                # NUEVO - capa pluggable
│   ├── types.ts                 # Interfaz base EcommerceProvider
│   ├── registry.ts              # Registro de providers
│   ├── reservationManager.ts    # Logica de reservas temporales
│   │
│   ├── vtex/                    # Provider VTEX
│   │   ├── vtexProvider.ts      # Implementacion de EcommerceProvider
│   │   ├── vtexWebhook.ts       # Handler de webhooks VTEX
│   │   └── vtexTypes.ts         # Tipos especificos VTEX
│   │
│   └── [shopify/]               # Futuro: Provider Shopify
│       └── ...
│
├── routes/
│   ├── ...                      # Rutas existentes (sin tocar)
│   └── integrationRoutes.ts     # NUEVO - rutas de integracion
│
└── middleware/
    └── integrationAuth.ts       # NUEVO - auth para webhooks
```

### 2.2 Interfaz Base del Provider

```typescript
// backend/src/integrations/types.ts

export type EcommercePlatform = 'vtex' | 'shopify' | 'woocommerce';

export interface EcommerceProvider {
  platform: EcommercePlatform;

  // Valida que el webhook/request viene realmente de esta plataforma
  validateWebhook(req: Request): Promise<boolean>;

  // Extrae datos del pedido desde el payload del webhook
  parseOrderPayload(payload: any): Promise<ParsedOrder>;

  // Opcional: notifica a la plataforma que la reserva fue confirmada
  notifyPlatform?(orderId: string, bookingId: string): Promise<void>;
}

export interface ParsedOrder {
  externalOrderId: string;       // ID del pedido en el ecommerce
  platform: EcommercePlatform;
  status: 'payment_approved' | 'cancelled' | 'invoiced';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: ParsedOrderItem[];
}

export interface ParsedOrderItem {
  externalProductId: string;     // productId en el ecommerce
  quantity: number;
  price?: number;
}

export interface ProductServiceMap {
  id: string;
  accountId: string;
  platform: EcommercePlatform;
  externalProductId: string;     // ID del producto en el ecommerce
  serviceId: string;             // ID del servicio en Koru Booking
  active: boolean;
}

export interface BookingReservation {
  id: string;
  accountId: string;
  serviceId: string;
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:mm
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  externalOrderId?: string;      // Se llena cuando se crea el pedido
  platform: EcommercePlatform;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  expiresAt: Date;               // TTL para reservas no confirmadas
  createdAt: Date;
}
```

### 2.3 Nuevos Modelos Prisma

```prisma
// Agregar al schema.prisma existente

model EcommerceIntegration {
  id            String   @id @default(uuid())
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id])
  platform      String   // 'vtex' | 'shopify' | 'woocommerce'
  active        Boolean  @default(true)

  // Configuracion especifica de la plataforma (JSON flexible)
  config        Json     @default("{}")
  // Para VTEX: { accountName, appKey, appToken, webhookSecret }
  // Para Shopify: { shopDomain, apiKey, apiSecret, webhookSecret }

  webhookSecret String?  // Secret para validar webhooks entrantes

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Un account puede tener una integracion por plataforma
  @@unique([accountId, platform])
  @@index([accountId])
}

model ProductServiceMapping {
  id                String   @id @default(uuid())
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])
  platform          String   // 'vtex' | 'shopify' | etc.
  externalProductId String   // ID del producto en el ecommerce
  serviceId         String
  service           Service  @relation(fields: [serviceId], references: [id])
  active            Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Un producto externo mapea a un solo servicio por account+plataforma
  @@unique([accountId, platform, externalProductId])
  @@index([accountId, platform])
  @@index([serviceId])
}

model BookingReservation {
  id              String   @id @default(uuid())
  accountId       String
  account         Account  @relation(fields: [accountId], references: [id])
  serviceId       String
  service         Service  @relation(fields: [serviceId], references: [id])
  date            DateTime
  time            String   // HH:mm
  customerName    String
  customerEmail   String
  customerPhone   String?
  notes           String?
  platform        String   // 'vtex' | 'shopify' | etc.
  externalOrderId String?  // Se llena al crear pedido en ecommerce
  status          String   @default("pending") // pending | confirmed | expired | cancelled
  expiresAt       DateTime // TTL: si no se confirma, se libera el slot
  bookingId       String?  // Referencia al Booking final cuando se confirma
  booking         Booking? @relation(fields: [bookingId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([accountId, serviceId, date, time, status])
  @@index([accountId, platform])
  @@index([externalOrderId])
  @@index([status, expiresAt]) // Para cleanup de expiradas
}
```

---

## 3. Nuevos Endpoints del Backend

Todos bajo `/api/integrations/ecommerce/` — completamente separados de las rutas existentes.

### 3.1 Gestion de Integraciones

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/integrations/ecommerce` | Lista integraciones del account | JWT (Backoffice) |
| POST | `/api/integrations/ecommerce` | Crea/actualiza integracion | JWT (Backoffice) |
| DELETE | `/api/integrations/ecommerce/:platform` | Desactiva integracion | JWT (Backoffice) |

**POST body ejemplo (VTEX)**:
```json
{
  "platform": "vtex",
  "config": {
    "accountName": "tienda-peluqueria",
    "appKey": "vtexappkey-tienda-xxx",
    "appToken": "XXXXXXXXXXXX"
  },
  "webhookSecret": "mi-secret-para-validar-hooks"
}
```

### 3.2 Mapeo Producto-Servicio

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/integrations/ecommerce/mappings` | Lista mapeos del account | JWT (Backoffice) |
| POST | `/api/integrations/ecommerce/mappings` | Crea mapeo producto→servicio | JWT (Backoffice) |
| PUT | `/api/integrations/ecommerce/mappings/:id` | Actualiza mapeo | JWT (Backoffice) |
| DELETE | `/api/integrations/ecommerce/mappings/:id` | Elimina mapeo | JWT (Backoffice) |
| GET | `/api/integrations/ecommerce/mappings/resolve?platform=vtex&productId=123` | Resuelve servicio para un producto | API Key / Webhook |

**POST body ejemplo**:
```json
{
  "platform": "vtex",
  "externalProductId": "12345",
  "serviceId": "uuid-del-servicio-corte-de-pelo"
}
```

### 3.3 Reservas Temporales

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | `/api/integrations/ecommerce/reserve` | Crea reserva temporal (bloquea slot) | API Key |
| GET | `/api/integrations/ecommerce/reserve/:id` | Consulta estado de reserva | API Key |
| DELETE | `/api/integrations/ecommerce/reserve/:id` | Cancela reserva temporal | API Key |

**POST /reserve body**:
```json
{
  "platform": "vtex",
  "accountId": "uuid-account",
  "serviceId": "uuid-servicio",
  "date": "2026-04-01",
  "time": "10:00",
  "customerName": "Juan Perez",
  "customerEmail": "juan@email.com",
  "customerPhone": "+5491112345678",
  "ttlMinutes": 30
}
```

**Response**:
```json
{
  "reservationId": "uuid-reserva",
  "status": "pending",
  "expiresAt": "2026-04-01T10:30:00Z",
  "message": "Slot reservado temporalmente. Confirmar antes de expiracion."
}
```

### 3.4 Webhooks (reciben eventos del ecommerce)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | `/api/integrations/webhooks/vtex` | Recibe eventos de pedidos VTEX | Webhook Secret |
| POST | `/api/integrations/webhooks/shopify` | (Futuro) Eventos Shopify | HMAC |

**Payload que envia VTEX (Order Hook)**:
```json
{
  "Domain": "Marketplace",
  "OrderId": "1234567890-01",
  "State": "payment-approved",
  "LastState": "payment-pending",
  "LastChange": "2026-04-01T10:31:00.000Z",
  "CurrentChange": "2026-04-01T10:32:00.000Z"
}
```

**Logica del webhook handler**:
1. Valida el secret del header
2. Si `State === "payment-approved"`:
   - Busca la reserva por `externalOrderId`
   - Si existe → llama al core para crear el `Booking` definitivo
   - Marca la reserva como `confirmed`
   - Envia emails de confirmacion
3. Si `State === "cancelled"`:
   - Busca la reserva/booking
   - Cancela y libera el slot

---

## 4. Flujo Completo: Cliente en PDP de VTEX

```
Paso 1: Cliente abre PDP del producto "Corte de Pelo" en VTEX
         │
         ▼
Paso 2: Block React (booking-widget) se renderiza en la PDP
         - Lee productId del contexto de producto (useProduct hook)
         - Llama al VTEX IO Service: GET /_v/booking/slots/{serviceId}?date=2026-04-01
         - El Service consulta mapeo en Koru Backend y obtiene slots disponibles
         │
         ▼
Paso 3: Cliente ve calendario + slots disponibles
         - Selecciona fecha: 1 de abril
         - Selecciona hora: 10:00
         │
         ▼
Paso 4: Al seleccionar slot, el VTEX IO Service:
         - POST /_v/booking/reserve → Koru Backend crea BookingReservation (TTL: 30 min)
         - El slot queda bloqueado temporalmente
         - Guarda reservationId en el orderForm de VTEX (customData attachment)
         │
         ▼
Paso 5: Cliente hace click en "Comprar" (boton de VTEX)
         - Flujo normal de checkout VTEX (carrito → datos → pago)
         - El reservationId viaja en el orderForm como metadata
         │
         ▼
Paso 6: Cliente completa el pago
         - VTEX procesa el pago
         - Pedido pasa a status "payment-approved"
         │
         ▼
Paso 7: VTEX dispara Order Hook → POST /api/integrations/webhooks/vtex
         - Koru Backend recibe el evento
         - Busca la reserva temporal por orderId
         - Crea el Booking definitivo (misma logica del core)
         - Marca reserva como "confirmed"
         - Envia email de confirmacion al cliente
         - Envia email de notificacion al admin
         │
         ▼
Paso 8: Cliente recibe email con confirmacion de su turno
         "Tu turno de Corte de Pelo: 1 de abril a las 10:00"
```

### Flujo alternativo: Reserva expira

```
Si el cliente selecciona slot pero NO completa la compra en 30 minutos:
  - Un cron job (o check lazy) detecta reservas expiradas
  - Marca la reserva como "expired"
  - El slot vuelve a estar disponible para otros clientes
```

### Flujo alternativo: Pedido cancelado

```
Si VTEX envia State: "cancelled":
  - Webhook handler busca la reserva/booking
  - Si era reserva temporal → marca como "cancelled"
  - Si ya era booking confirmado → cancela el booking
  - El slot se libera
```

---

## 5. VTEX IO App: Estructura Completa

Esta es la app que se instala en la tienda VTEX del cliente.

### 5.1 Estructura de archivos

```
vtex-booking-app/
├── manifest.json
├── store/
│   └── interfaces.json
├── react/
│   ├── BookingWidget.tsx          # Componente principal (block PDP)
│   ├── components/
│   │   ├── SlotPicker.tsx         # Selector de fecha y hora
│   │   ├── SlotGrid.tsx           # Grilla de horarios disponibles
│   │   └── BookingConfirmation.tsx # Confirmacion pre-checkout
│   ├── hooks/
│   │   ├── useBookingSlots.ts     # Fetch de slots disponibles
│   │   └── useReservation.ts      # Crear/cancelar reservas
│   └── typings/
│       └── booking.d.ts
├── node/
│   ├── index.ts                   # Service entry point
│   ├── service.json               # Routes + events
│   ├── clients/
│   │   ├── index.ts
│   │   └── koruBooking.ts         # Cliente HTTP para Koru Backend
│   └── handlers/
│       ├── getSlots.ts            # Proxy: slots disponibles
│       ├── createReservation.ts   # Proxy: crear reserva temporal
│       └── orderEvent.ts          # Event handler: payment-approved
├── messages/
│   ├── es.json
│   └── en.json
└── docs/
    └── README.md
```

### 5.2 manifest.json

```json
{
  "name": "booking-widget",
  "vendor": "korusuite",
  "version": "0.1.0",
  "title": "Koru Booking Widget",
  "description": "Embeds booking availability on the product detail page",
  "mustUpdateAt": "2026-12-31",
  "builders": {
    "react": "3.x",
    "store": "0.x",
    "node": "7.x",
    "messages": "1.x",
    "docs": "0.x"
  },
  "dependencies": {
    "vtex.product-context": "0.x",
    "vtex.css-handles": "0.x",
    "vtex.pixel-manager": "1.x",
    "vtex.order-manager": "0.x"
  },
  "policies": [
    {
      "name": "outbound-access",
      "attrs": {
        "host": "koru-booking-backend.vercel.app",
        "path": "/api/*"
      }
    },
    {
      "name": "colossus-fire-event"
    },
    {
      "name": "colossus-write-logs"
    }
  ],
  "settingsSchema": {
    "title": "Koru Booking Settings",
    "type": "object",
    "properties": {
      "koruAccountId": {
        "title": "Koru Account ID",
        "type": "string"
      },
      "koruWebsiteId": {
        "title": "Koru Website ID",
        "type": "string"
      },
      "koruAppId": {
        "title": "Koru App ID",
        "type": "string"
      },
      "reservationTTL": {
        "title": "Reservation TTL (minutes)",
        "type": "number",
        "default": 30
      }
    }
  }
}
```

### 5.3 node/service.json

```json
{
  "memory": 256,
  "ttl": 10,
  "timeout": 10,
  "minReplicas": 2,
  "maxReplicas": 4,
  "routes": {
    "getSlots": {
      "path": "/_v/booking/slots/:serviceId",
      "public": true
    },
    "createReservation": {
      "path": "/_v/booking/reserve",
      "public": true
    },
    "cancelReservation": {
      "path": "/_v/booking/reserve/:reservationId",
      "public": true
    }
  },
  "events": {
    "orderPaymentApproved": {
      "sender": "vtex.orders-broadcast",
      "topics": ["payment-approved"]
    },
    "orderCancelled": {
      "sender": "vtex.orders-broadcast",
      "topics": ["canceled"]
    }
  }
}
```

### 5.4 store/interfaces.json

```json
{
  "booking-widget": {
    "component": "BookingWidget",
    "composition": "children",
    "allowed": ["booking-slot-picker"]
  },
  "booking-slot-picker": {
    "component": "SlotPicker"
  }
}
```

### 5.5 Componente React Principal

```tsx
// react/BookingWidget.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { useProduct } from 'vtex.product-context'
import { useCssHandles } from 'vtex.css-handles'
import SlotPicker from './components/SlotPicker'
import { useBookingSlots } from './hooks/useBookingSlots'

const CSS_HANDLES = [
  'bookingContainer',
  'bookingTitle',
  'bookingLoading',
  'bookingError',
  'bookingUnavailable'
] as const

interface Props {
  koruAccountId: string
  koruWebsiteId: string
  koruAppId: string
  reservationTTL: number
}

const BookingWidget: StorefrontFunctionComponent<Props> = ({
  koruAccountId,
  koruWebsiteId,
  koruAppId,
  reservationTTL = 30
}) => {
  const handles = useCssHandles(CSS_HANDLES)
  const productContext = useProduct()
  const product = productContext?.product

  // Leer serviceId desde las especificaciones del producto
  const serviceId = useMemo(() => {
    const specs = product?.properties ?? []
    const spec = specs.find(s => s.name === 'BookingServiceId')
    return spec?.values?.[0] ?? null
  }, [product])

  // Si el producto no tiene BookingServiceId, no renderizar nada
  if (!serviceId) return null

  return (
    <div className={handles.bookingContainer}>
      <h3 className={handles.bookingTitle}>Reserva tu turno</h3>
      <SlotPicker
        serviceId={serviceId}
        accountId={koruAccountId}
        websiteId={koruWebsiteId}
        appId={koruAppId}
        reservationTTL={reservationTTL}
      />
    </div>
  )
}

BookingWidget.schema = {
  title: 'Koru Booking Widget',
  type: 'object',
  properties: {
    koruAccountId: { title: 'Koru Account ID', type: 'string' },
    koruWebsiteId: { title: 'Koru Website ID', type: 'string' },
    koruAppId: { title: 'Koru App ID', type: 'string' },
    reservationTTL: { title: 'TTL Reserva (min)', type: 'number', default: 30 },
  },
}

export default BookingWidget
```

### 5.6 Instalacion en el store-theme del cliente

```jsonc
// store-theme/store/blocks/product/product.jsonc
{
  "store.product": {
    "children": [
      "flex-layout.row#product-main",
      "booking-widget#default"       // <-- agregar el block
    ]
  },

  "booking-widget#default": {
    "props": {
      "koruAccountId": "uuid-del-account",
      "koruWebsiteId": "website-id-koru",
      "koruAppId": "app-id-koru",
      "reservationTTL": 30
    }
  }
}
```

---

## 6. Cambios en el Backend Existente

### 6.1 Lo que NO se toca

| Componente | Estado |
|---|---|
| SlotCalculator.ts | Sin cambios |
| ConflictValidator.ts | Sin cambios |
| BookingsController.ts | Sin cambios |
| EmailService.ts | Sin cambios |
| Rutas existentes (/api/services, /api/bookings, etc.) | Sin cambios |
| Widget standalone | Sin cambios |
| Backoffice existente | Sin cambios (se agregan paginas nuevas) |

### 6.2 Lo que se agrega

| Componente | Descripcion |
|---|---|
| `integrations/` directorio | Toda la logica de integracion ecommerce |
| `integrationRoutes.ts` | Nuevas rutas bajo `/api/integrations/` |
| `integrationAuth.ts` | Middleware de auth para webhooks (valida secrets) |
| `reservationManager.ts` | Gestion de reservas temporales con TTL |
| `vtex/vtexProvider.ts` | Implementacion del provider VTEX |
| Modelos Prisma nuevos | EcommerceIntegration, ProductServiceMapping, BookingReservation |
| Cron/cleanup job | Limpieza de reservas expiradas |

### 6.3 ReservationManager: Logica Central

```typescript
// backend/src/integrations/reservationManager.ts

export class ReservationManager {

  // Crea una reserva temporal que bloquea un slot
  async createReservation(data: CreateReservationInput): Promise<BookingReservation> {
    return prisma.$transaction(async (tx) => {
      // 1. Verificar que el slot esta disponible (misma logica que ConflictValidator)
      const existing = await tx.booking.findFirst({
        where: { accountId, serviceId, date, time, status: { not: 'cancelled' } }
      });
      if (existing) throw new ConflictError('Slot already booked');

      // 2. Verificar que no hay otra reserva activa para ese slot
      const existingReservation = await tx.bookingReservation.findFirst({
        where: { accountId, serviceId, date, time, status: 'pending',
                 expiresAt: { gt: new Date() } }
      });
      if (existingReservation) throw new ConflictError('Slot temporarily reserved');

      // 3. Crear reserva temporal
      return tx.bookingReservation.create({
        data: {
          accountId, serviceId, date, time,
          customerName, customerEmail, customerPhone,
          platform, status: 'pending',
          expiresAt: addMinutes(new Date(), ttlMinutes)
        }
      });
    });
  }

  // Confirma una reserva → crea el Booking definitivo
  async confirmReservation(reservationId: string, externalOrderId: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.bookingReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation || reservation.status !== 'pending') {
        throw new Error('Reservation not found or already processed');
      }

      // Crear booking definitivo usando la misma logica del core
      const booking = await tx.booking.create({
        data: {
          accountId: reservation.accountId,
          serviceId: reservation.serviceId,
          date: reservation.date,
          time: reservation.time,
          customerName: reservation.customerName,
          customerEmail: reservation.customerEmail,
          customerPhone: reservation.customerPhone,
          status: 'confirmed'
        }
      });

      // Marcar reserva como confirmada
      await tx.bookingReservation.update({
        where: { id: reservationId },
        data: { status: 'confirmed', bookingId: booking.id, externalOrderId }
      });

      return booking;
    });
  }

  // Limpieza de reservas expiradas
  async cleanupExpired(): Promise<number> {
    const result = await prisma.bookingReservation.updateMany({
      where: { status: 'pending', expiresAt: { lt: new Date() } },
      data: { status: 'expired' }
    });
    return result.count;
  }
}
```

### 6.4 Modificacion al SlotCalculator

El unico cambio necesario en el core es que el `SlotCalculator` tambien considere las **reservas temporales activas** al calcular slots disponibles:

```typescript
// En SlotCalculator.ts, dentro de calculateAvailableSlots():

// Existente: buscar bookings confirmados
const bookings = await prisma.booking.findMany({
  where: { accountId, date: dateObj, status: { not: 'cancelled' } },
  include: { service: { select: { duration: true, buffer: true } } }
});

// NUEVO: tambien buscar reservas temporales activas
const activeReservations = await prisma.bookingReservation.findMany({
  where: {
    accountId,
    date: dateObj,
    status: 'pending',
    expiresAt: { gt: new Date() }
  },
  include: { service: { select: { duration: true, buffer: true } } }
});

// Combinar ambos para calcular slots ocupados
const allOccupied = [...bookings, ...activeReservations];
```

> **Nota**: Este es el UNICO cambio al core, y es aditivo (no rompe nada). Si no hay reservas temporales (porque no se usa integracion ecommerce), la query simplemente devuelve un array vacio.

---

## 7. Cambios en el Backoffice

Se agregan **nuevas paginas** sin modificar las existentes.

### 7.1 Nuevas rutas

| Ruta | Pagina | Descripcion |
|---|---|---|
| `/integrations` | IntegrationsDashboard | Panel general de integraciones |
| `/integrations/vtex` | VtexIntegration | Configuracion de la integracion VTEX |
| `/integrations/vtex/mappings` | ProductMappings | Gestion de mapeos producto→servicio |

### 7.2 Pagina de Integraciones

Cards por cada plataforma soportada:
- **VTEX** — Activa/Inactiva, boton "Configurar"
- **Shopify** — "Proximamente"
- **WooCommerce** — "Proximamente"

### 7.3 Pagina de Configuracion VTEX

Formulario con:
- Account Name de VTEX
- App Key y App Token (encriptados en DB)
- Webhook Secret (auto-generado)
- URL del webhook para copiar: `https://koru-booking-backend.vercel.app/api/integrations/webhooks/vtex`
- Instrucciones para configurar el Hook en VTEX Admin
- Boton "Probar conexion" (valida credenciales contra la API de VTEX)

### 7.4 Pagina de Mapeos Producto-Servicio

Tabla con:
| Producto VTEX (ID) | Servicio Koru | Estado | Acciones |
|---|---|---|---|
| 12345 | Corte de Pelo | Activo | Editar / Eliminar |
| 67890 | Tintura | Activo | Editar / Eliminar |

Boton "Nuevo Mapeo" → formulario:
- ID del Producto VTEX (texto)
- Servicio (dropdown de servicios del account)
- Activo (toggle)

---

## 8. Configuracion en VTEX

### 8.1 Crear el Order Hook

En el panel de VTEX Admin o via API:

```bash
curl -X POST "https://{account}.myvtex.com/api/orders/hook/config" \
  -H "X-VTEX-API-AppKey: {appKey}" \
  -H "X-VTEX-API-AppToken: {appToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "type": "FromWorkflow",
      "status": ["payment-approved", "canceled"]
    },
    "hook": {
      "url": "https://koru-booking-backend.vercel.app/api/integrations/webhooks/vtex",
      "headers": {
        "x-webhook-secret": "{webhookSecret}"
      }
    }
  }'
```

### 8.2 Crear especificacion de producto

En VTEX Admin → Catalogo → Categorias → (categoria de servicios) → Especificaciones:
- Nombre del campo: `BookingServiceId`
- Tipo: Texto
- Obligatorio: No (solo los productos que son servicios lo tendran)

### 8.3 Instalar la VTEX IO App

```bash
vtex login {accountName}
vtex install korusuite.booking-widget@0.x
```

Luego en el store-theme agregar el block `booking-widget` a la PDP.

---

## 9. Seguridad

### 9.1 Autenticacion de Webhooks

```typescript
// backend/src/middleware/integrationAuth.ts

export function webhookAuth(platform: EcommercePlatform) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-webhook-secret'];
    if (!secret) return res.status(401).json({ error: 'Missing webhook secret' });

    // Buscar la integracion por plataforma y validar el secret
    const integration = await prisma.ecommerceIntegration.findFirst({
      where: { platform, webhookSecret: secret, active: true }
    });

    if (!integration) return res.status(403).json({ error: 'Invalid webhook secret' });

    req.accountId = integration.accountId;
    req.integrationId = integration.id;
    next();
  };
}
```

### 9.2 Encriptacion de credenciales

Las API keys de VTEX (appKey, appToken) se almacenan **encriptadas** en el campo `config` de `EcommerceIntegration` usando AES-256-GCM con una clave de entorno (`ENCRYPTION_KEY`).

### 9.3 Rate limiting

Los endpoints de webhook deben tener rate limiting para prevenir abuso:
- Webhooks: 100 req/min por IP
- Slots (publico): 60 req/min por IP

### 9.4 Respuesta rapida a webhooks

VTEX requiere respuesta en **< 5 segundos**. El webhook handler debe:
1. Validar el secret
2. Encolar el procesamiento (no procesar sincrono)
3. Responder 200 inmediatamente
4. Procesar la confirmacion de forma asincrona

---

## 10. Variables de Entorno Nuevas

```env
# Backend - agregar a .env existente

# Encriptacion de credenciales de ecommerce
ENCRYPTION_KEY=una-clave-de-32-caracteres-min

# Opcional: configuracion de cleanup de reservas
RESERVATION_CLEANUP_INTERVAL_MS=60000    # Cada 1 minuto
RESERVATION_DEFAULT_TTL_MINUTES=30       # TTL por defecto
```

---

## 11. Fases de Implementacion

### Fase 1: Backend - Capa de Integracion (Semana 1-2)

1. Agregar modelos Prisma (EcommerceIntegration, ProductServiceMapping, BookingReservation)
2. Ejecutar migracion
3. Implementar `integrations/types.ts` (interfaces base)
4. Implementar `ReservationManager`
5. Implementar `vtexProvider.ts` + `vtexWebhook.ts`
6. Crear rutas `/api/integrations/...`
7. Crear middleware `webhookAuth`
8. Modificar SlotCalculator para considerar reservas activas
9. Implementar cleanup job de reservas expiradas
10. Tests unitarios y de integracion

### Fase 2: Backoffice - Paginas de Integracion (Semana 2-3)

1. Pagina de Integraciones (dashboard)
2. Pagina de configuracion VTEX
3. Pagina de mapeos producto-servicio
4. Integracion con API de integraciones
5. Tests de las nuevas paginas

### Fase 3: VTEX IO App (Semana 3-4)

1. Scaffold de la app (manifest, builders)
2. Componente React BookingWidget + SlotPicker
3. VTEX IO Service (proxy routes + event handlers)
4. Estilos y responsive
5. Internacionalizacion (messages)
6. Documentacion de instalacion

### Fase 4: Integracion E2E y QA (Semana 4-5)

1. Configurar Order Hook en tienda VTEX de prueba
2. Crear productos con especificacion BookingServiceId
3. Test E2E del flujo completo: PDP → seleccionar slot → comprar → confirmacion
4. Test de edge cases: reserva expirada, pedido cancelado, doble reserva
5. Test de carga: multiples usuarios reservando simultaneamente
6. Deploy a produccion

### Fase 5: Documentacion y Entrega (Semana 5)

1. Guia de instalacion para el cliente VTEX
2. Documentacion de la API de integraciones
3. Guia de troubleshooting
4. Capacitacion al equipo

---

## 12. Consideraciones para Futuras Integraciones

El diseno con Provider Pattern permite agregar nuevas plataformas implementando la interfaz `EcommerceProvider`:

### Shopify (futuro)

```typescript
class ShopifyProvider implements EcommerceProvider {
  platform = 'shopify' as const;

  async validateWebhook(req: Request): Promise<boolean> {
    // Validar HMAC-SHA256 del header X-Shopify-Hmac-Sha256
  }

  async parseOrderPayload(payload: any): Promise<ParsedOrder> {
    // Mapear webhook de Shopify (orders/paid topic)
  }
}
```

- Webhook: `orders/paid` topic
- Product metafields para mapeo producto-servicio
- App embeds para widget en PDP

### WooCommerce (futuro)

```typescript
class WooCommerceProvider implements EcommerceProvider {
  platform = 'woocommerce' as const;

  async validateWebhook(req: Request): Promise<boolean> {
    // Validar X-WC-Webhook-Signature (HMAC-SHA256 base64)
  }

  async parseOrderPayload(payload: any): Promise<ParsedOrder> {
    // Mapear webhook de WooCommerce (order.completed action)
  }
}
```

- Webhook: `order.completed` action
- Custom fields para mapeo producto-servicio
- Widget via shortcode o bloque Gutenberg

---

## 13. Resumen Ejecutivo

| Aspecto | Detalle |
|---|---|
| **Impacto en app existente** | Minimo. Un cambio aditivo en SlotCalculator + nuevos modelos/rutas |
| **Nuevos modelos de datos** | 3 (EcommerceIntegration, ProductServiceMapping, BookingReservation) |
| **Nuevos endpoints** | ~10 bajo `/api/integrations/` |
| **VTEX IO App** | 1 app nueva (storefront block + service + events) |
| **Backoffice** | 3 paginas nuevas bajo `/integrations` |
| **Seguridad** | Webhook secrets, encriptacion de API keys, rate limiting |
| **Escalabilidad** | Provider Pattern para agregar plataformas sin tocar el core |
| **Tiempo estimado** | 5 semanas (con 1 desarrollador dedicado) |
| **Riesgo principal** | Latencia del webhook VTEX → respuesta < 5s obligatoria |
