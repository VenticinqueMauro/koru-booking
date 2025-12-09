# Koru Booking Widget

Widget embebible para sistema de reservas Koru Booking, integrado con [Koru Platform](https://app-manager.vercel.app).

## 🚀 Instalación en tu Sitio Web

### Opción 1: Script Tag (Recomendado)

Copia y pega este código en tu sitio web, justo antes del cierre de `</body>`:

```html
<script
  src="https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js"
  data-website-id="250ad662-1ceb-4de2-b0f3-ac6f7929e783"
  data-app-id="034927e7-ebe2-4c6b-9c9d-9b56c453d807"
  data-app-manager-url="https://app-manager.vercel.app"
  async
></script>
```

### Opción 2: Contenedor Específico (Modo Inline)

Si quieres que el widget aparezca en un lugar específico, agrega un contenedor:

```html
<!-- Donde quieres que aparezca el widget -->
<div id="widget-root"></div>

<!-- Script al final del body -->
<script
  src="https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js"
  data-website-id="250ad662-1ceb-4de2-b0f3-ac6f7929e783"
  data-app-id="034927e7-ebe2-4c6b-9c9d-9b56c453d807"
  data-app-manager-url="https://app-manager.vercel.app"
  async
></script>
```

**Nota:** Configura el `displayMode` en Koru Platform:
- `inline`: El widget se renderiza en `#widget-root` o al final del body
- `modal`: Aparece un botón flotante que abre el widget en modal

## ⚙️ Configuración

La configuración del widget se gestiona desde [Koru Platform](https://app-manager.vercel.app). Puedes personalizar:

| Opción | Tipo | Descripción | Por Defecto |
|--------|------|-------------|-------------|
| `accentColor` | string | Color principal del widget (formato Hex) | `#00C896` |
| `displayMode` | `inline` \| `modal` | Modo de visualización | `modal` |
| `triggerText` | string | Texto del botón disparador (solo modo modal) | `Reservar ahora` |
| `triggerPosition` | enum | Esquina del botón flotante | `bottom-right` |
| `offsetX` | number | Distancia horizontal desde el borde (px) | `24` |
| `offsetY` | number | Distancia vertical desde el borde (px) | `24` |

### Configuración de Posición

La posición del botón flotante (solo en modo `modal`) se controla con tres propiedades:

1. **`triggerPosition`**: Define la esquina base
   - `bottom-right` (por defecto)
   - `bottom-left`
   - `top-right`
   - `top-left`

2. **`offsetX`**: Distancia horizontal desde el borde (0-200 píxeles)
3. **`offsetY`**: Distancia vertical desde el borde (0-200 píxeles)

#### Ejemplos de Configuración:

**Esquina inferior derecha (por defecto):**
```json
{
  "triggerPosition": "bottom-right",
  "offsetX": 24,
  "offsetY": 24
}
```

**Esquina inferior izquierda:**
```json
{
  "triggerPosition": "bottom-left",
  "offsetX": 24,
  "offsetY": 24
}
```

**Botón más arriba para evitar conflicto con WhatsApp:**
```json
{
  "triggerPosition": "bottom-right",
  "offsetX": 24,
  "offsetY": 100
}
```

**Nota:** Las configuraciones de `apiUrl`, `layout` y `stepInterval` se manejan desde el backoffice y no son configurables desde el widget.

## 🎨 Características

- ✅ Wizard de 4 pasos intuitivo (Servicio → Fecha/Hora → Datos → Confirmación)
- ✅ Calendario visual con disponibilidad en tiempo real
- ✅ Validación de formularios
- ✅ Responsive (móvil y desktop)
- ✅ Bundle ultra-ligero (~19KB gzip)
- ✅ Prevención de conflictos (validación atómica)
- ✅ Export a Google Calendar
- ✅ Integración completa con Koru Platform

## 🧪 Testing

### Modo Desarrollo (Local)

```bash
npm install
npm run dev
```

Abre http://localhost:3001 - El widget funcionará con configuración mock sin necesidad de Koru Platform.

### Modo Producción (Test)

Abre `test-production.html` en tu navegador para probar la integración completa con Koru Platform.

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/`:
- `koru-booking-widget.umd.js` - Bundle UMD (68KB, 19KB gzipped)
- `koru-booking-widget.es.js` - Bundle ESM
- `style.css` - Estilos del widget

## 📁 Estructura del Proyecto

```
widget/
├── src/
│   ├── widget.ts              # Clase principal (extiende KoruWidget)
│   ├── index.ts               # Entry point
│   ├── components/
│   │   ├── ServiceSelector.ts # Paso 1: Selección de servicio
│   │   ├── DateTimePicker.ts  # Paso 2: Fecha y hora
│   │   ├── CustomerForm.ts    # Paso 3: Datos del cliente
│   │   └── Confirmation.ts    # Paso 4: Confirmación
│   ├── api/
│   │   └── client.ts          # Cliente HTTP para backend
│   ├── utils/
│   │   ├── date.ts            # Helpers de fechas
│   │   └── validation.ts      # Validaciones
│   └── styles/
│       └── widget.css         # Estilos
├── demo.html                  # Demo local
├── test-production.html       # Test de producción
└── package.json
```

## 🔌 API Backend Requerida

El widget consume estos endpoints del backend:

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

## 🔧 Arquitectura Técnica

### Integración con Koru SDK

El widget extiende la clase `KoruWidget` del SDK oficial (`@redclover/koru-sdk`), implementando:

- **`onInit(config)`**: Inicializa el widget y carga servicios del backend
- **`onRender(config)`**: Renderiza la UI según la configuración
- **`onDestroy()`**: Limpia recursos cuando el widget se detiene
- **`onConfigUpdate(config)`**: Actualiza configuración sin re-render completo

### Modo Desarrollo vs Producción

El widget detecta automáticamente el entorno:

**Localhost (Desarrollo):**
- Usa configuración mock
- No requiere autenticación con Koru
- Backend URL desde `.env` o `http://localhost:4000`

**Producción:**
- Autenticación automática con Koru App Manager
- Configuración dinámica desde Koru Platform
- Backend URL configurable desde la plataforma

## 🐛 Troubleshooting

### El widget no se carga
1. Verifica que la URL del script sea accesible
2. Revisa la consola del navegador para errores
3. Asegúrate de que los `data-attributes` sean correctos

### Error de CORS
El backend debe permitir requests desde el dominio donde está instalado el widget.

### El widget no muestra servicios
1. Verifica que el `apiUrl` esté configurado correctamente en Koru Platform
2. Asegúrate de que el backend esté accesible y retorne datos válidos
3. Revisa los logs en la consola del navegador

### Debug Mode
El widget tiene logging activado. Abre la consola del navegador para ver:
```
[koru-booking] 🚀 Production mode: Using Koru SDK authentication
[koru-booking] onInit called with config: {...}
[koru-booking] API Client configured with URL: https://...
[koru-booking] Services loaded: [...]
```

## 📄 Licencia

MIT © Red Clover
