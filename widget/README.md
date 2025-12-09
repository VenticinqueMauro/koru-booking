# Koru Booking Widget

Widget embebible ultra-ligero para sistema de reservas Koru Booking.

## 🚀 Inicio Rápido

### Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3001 para ver el demo.

### Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/`.

## 📦 Instalación

### Como Script (Recomendado)

```html
<script
  src="https://cdn.tu-dominio.com/koru-booking-widget.umd.js"
  data-website-id="ws_xxx"
  data-app-id="app_xxx"
  data-app-manager-url="https://www.korusuite.com"
></script>
```

### Como Módulo ES

```javascript
import { BookingWidget } from '@koru-booking/widget';

const widget = new BookingWidget();
widget.start();
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_KORU_WEBSITE_ID=ws_xxx
VITE_KORU_APP_ID=app_xxx
VITE_KORU_URL=https://www.korusuite.com
VITE_BACKEND_API_URL=http://localhost:4000
```

### Configuración del Widget

El widget se configura automáticamente desde Koru Platform con estos campos:

- **layout**: `list` | `grid` | `button` (Diseño de servicios)
- **stepInterval**: Intervalo visual de slots (minutos)
- **accentColor**: Color principal del widget
- **notifyEmail**: Email para notificaciones

## 🎨 Características

- ✅ Wizard de 4 pasos intuitivo
- ✅ Calendario visual con disponibilidad en tiempo real
- ✅ Validación de formularios
- ✅ Responsive (móvil y desktop)
- ✅ Bundle ultra-ligero (~2KB gzip)
- ✅ Prevención de conflictos (validación atómica)
- ✅ Export a Google Calendar

## 📁 Estructura

```
src/
├── widget.ts              # Clase principal
├── components/
│   ├── ServiceSelector.ts # Paso 1: Servicios
│   ├── DateTimePicker.ts  # Paso 2: Fecha/Hora
│   ├── CustomerForm.ts    # Paso 3: Datos
│   └── Confirmation.ts    # Paso 4: Éxito
├── api/
│   └── client.ts          # Cliente HTTP
├── utils/
│   ├── date.ts            # Helpers de fechas
│   └── validation.ts      # Validaciones
├── styles/
│   └── widget.css         # Estilos
└── index.ts               # Entry point
```

## 🔌 API Backend Requerida

El widget consume estos endpoints:

### `GET /api/services`
Retorna lista de servicios activos.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Corte de Pelo",
    "duration": 30,
    "price": 25,
    "buffer": 10,
    "imageUrl": "https://...",
    "active": true
  }
]
```

### `GET /api/slots?serviceId=xxx&date=2024-01-15`
Retorna slots disponibles para un servicio en una fecha.

**Response:**
```json
{
  "slots": ["09:00", "09:30", "10:00", "14:00"]
}
```

### `POST /api/bookings`
Crea una nueva reserva.

**Request:**
```json
{
  "serviceId": "uuid",
  "date": "2024-01-15",
  "time": "10:00",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "customerPhone": "+34600000000",
  "notes": "Notas opcionales"
}
```

**Response:**
```json
{
  "id": "uuid",
  "serviceId": "uuid",
  "serviceName": "Corte de Pelo",
  "date": "2024-01-15",
  "time": "10:00",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "status": "confirmed"
}
```

## 🐛 Debugging

Activa el modo debug en `widget.ts`:

```typescript
options: {
  debug: true, // Logs en consola
}
```

## 📄 Licencia

MIT © Red Clover
