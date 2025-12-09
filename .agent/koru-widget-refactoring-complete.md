# ✅ Refactorización Completada: Koru Booking Widget

## Cambios Implementados

### 1. **Integración con Koru SDK** ✅
- La clase `BookingWidget` ahora extiende `KoruWidget` del SDK oficial (`@redclover/koru-sdk`)
- Implementados los 3 lifecycle hooks requeridos:
  - `onInit(config)`: Inicializa el widget y carga servicios
  - `onRender(config)`: Renderiza la UI del widget
  - `onDestroy()`: Limpia recursos y elementos DOM
  - `onConfigUpdate(config)`: Actualiza configuración sin re-render completo (opcional)

### 2. **Modo Desarrollo Local** ✅
- Override del método `start()` que detecta automáticamente si estás en localhost
- En desarrollo: usa configuración mock sin necesidad de Koru App Manager
- En producción: delega al SDK para autenticación completa con Koru

### 3. **API Client Dinámico** ✅
- El `apiClient` ahora acepta URLs dinámicas desde el config de Koru
- Fallback a variables de entorno para desarrollo local
- Factory pattern para crear instancias con diferentes baseURLs

### 4. **Build Exitoso** ✅
```
✓ 314 modules transformed
dist/style.css                   19.67 kB │ gzip:  3.92 kB
dist/koru-booking-widget.umd.js  68.20 kB │ gzip: 19.67 kB
✓ built in 2.73s
```

## Datos para el Formulario de Koru

### Información Básica
| Campo | Valor |
|-------|-------|
| **Nombre de la App** | `Koru Booking` |
| **Descripción** | `Sistema de reservas online con calendario en tiempo real y gestión de citas` |
| **URL del Logo** | `https://placehold.co/400x400/00C896/ffffff?text=KB` |
| **Is this a widget app?** | ✅ **ON** |
| **Widget URL** | `https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js` |
| **Version** | `1.0.0` |
| **Estado** | `Activo` / `Published` |

### Esquema de Configuración (JSON)

Copia y pega este JSON completo en el campo "Esquema de Configuración (JSON)":

```json
[
  {
    "key": "apiUrl",
    "schema": {
      "type": "string",
      "description": "URL del backend API",
      "default": "https://api.koru-booking.example.com",
      "required": true
    }
  },
  {
    "key": "layout",
    "schema": {
      "type": "string",
      "description": "Diseño del widget",
      "enum": ["list", "grid", "button"],
      "default": "list",
      "required": false
    }
  },
  {
    "key": "accentColor",
    "schema": {
      "type": "string",
      "description": "Color principal (Hex)",
      "default": "#00C896",
      "required": false
    }
  },
  {
    "key": "stepInterval",
    "schema": {
      "type": "number",
      "description": "Intervalo de tiempo (minutos)",
      "default": 30,
      "required": false
    }
  },
  {
    "key": "notifyEmail",
    "schema": {
      "type": "string",
      "description": "Email para notificaciones",
      "required": false
    }
  },
  {
    "key": "displayMode",
    "schema": {
      "type": "string",
      "description": "Modo de visualización",
      "enum": ["inline", "modal"],
      "default": "inline",
      "required": false
    }
  },
  {
    "key": "triggerText",
    "schema": {
      "type": "string",
      "description": "Texto del botón (solo modo modal)",
      "default": "Reservar ahora",
      "required": false
    }
  },
  {
    "key": "triggerPosition",
    "schema": {
      "type": "string",
      "description": "Posición del botón (solo modo modal)",
      "enum": ["bottom-right", "bottom-left", "top-right", "top-left"],
      "default": "bottom-right",
      "required": false
    }
  }
]
```

## Cómo Funciona Ahora

### En Desarrollo Local (localhost)
```typescript
// El widget detecta automáticamente localhost y usa config mock
const widget = new BookingWidget();
widget.start(); // No requiere Koru App Manager
```

### En Producción (Koru Platform)
```html
<!-- El script tag con data attributes -->
<script 
  src="https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js"
  data-website-id="ws_xxx"
  data-app-id="app_xxx"
  data-app-manager-url="https://app.koru.com"
></script>
```

El SDK de Koru:
1. Lee los `data-attributes` del script tag
2. Se autentica con Koru App Manager
3. Obtiene la configuración del widget (incluyendo `apiUrl`, `accentColor`, etc.)
4. Llama a `onInit(config)` con la configuración
5. Llama a `onRender(config)` para mostrar el widget

### Preview Mode (Koru Platform)
Cuando Koru muestra el preview en su interfaz de administración:
```javascript
// Koru inyecta esto antes de cargar el widget
window.__KORU_PREVIEW_CONFIG__ = {
  apiUrl: "https://api.example.com",
  layout: "list",
  accentColor: "#00C896",
  displayMode: "modal"
};
```

El SDK detecta automáticamente `__KORU_PREVIEW_CONFIG__` y lo usa en lugar de hacer la llamada de autorización.

## Próximos Pasos

### 1. Desplegar el Widget Actualizado
```bash
cd widget
npm run build
# Commit y push a GitHub
git add .
git commit -m "feat: integrate with Koru SDK"
git push origin main
```

GitHub Pages actualizará automáticamente la URL del widget.

### 2. Registrar en Koru App Manager
1. Ve a la interfaz de administración de Koru
2. Completa el formulario "Agregar Nueva App" con los datos de arriba
3. Pega el JSON del schema de configuración
4. Asegúrate de que el campo "Estado" esté en "Activo"
5. Guarda

### 3. Verificar la Integración
Una vez guardado en Koru:
1. El preview debería mostrarse correctamente
2. Podrás configurar `apiUrl`, `layout`, `accentColor`, etc. desde la interfaz
3. El widget se podrá instalar en sitios web usando el script tag

## Testing Local

Para probar localmente:

```bash
cd widget
npm run dev
```

Abre http://localhost:3001 - verás el widget funcionando con la configuración mock.

## Diferencias Clave vs. Versión Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Clase base** | Custom `BookingWidget` | Extiende `KoruWidget` |
| **Autenticación** | Bypass manual | SDK maneja automáticamente |
| **Config** | Hardcoded | Dinámico desde Koru |
| **Preview mode** | No soportado | Automático vía SDK |
| **API URL** | Env var fija | Configurable desde Koru |
| **Data attributes** | No leídos | SDK los lee automáticamente |

## Troubleshooting

### Si el widget no carga en Koru:
1. Verifica que la URL del widget sea accesible: https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js
2. Asegúrate de que el campo "Estado" esté en "Activo"
3. Revisa la consola del navegador para errores
4. Verifica que el schema JSON esté bien formateado

### Si aparece "Widget URL not configured":
- El formulario no se guardó correctamente
- Falta algún campo requerido
- El campo "Widget URL" está vacío

### Para debug:
El widget tiene `debug: true` activado, por lo que verás logs en la consola:
```
[koru-booking] BookingWidget constructor called
[koru-booking] 🚀 Production mode: Using Koru SDK authentication
[koru-booking] onInit called with config: {...}
[koru-booking] API Client configured with URL: https://...
[koru-booking] Services loaded: [...]
```
