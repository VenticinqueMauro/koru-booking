# Análisis de Integración: Koru Booking Widget

## ❌ Problemas Identificados

### 1. **No extiende `KoruWidget` del SDK oficial**
Tu clase `BookingWidget` es completamente independiente y no hereda de `@redclover/koru-sdk`.

**Código actual:**
```typescript
export class BookingWidget {
  // Implementación custom
}
```

**Código esperado:**
```typescript
import { KoruWidget } from '@redclover/koru-sdk';

export class BookingWidget extends KoruWidget {
  constructor() {
    super({ 
      name: 'koru-booking', 
      version: '1.0.0',
      options: {
        debug: true,
        cache: true
      }
    });
  }
}
```

### 2. **Bypass manual del SDK en desarrollo**
Tu código tiene un bypass custom (`isDev`) que no es necesario. El SDK oficial ya maneja:
- Preview mode automático (`window.__KORU_PREVIEW_CONFIG__`)
- Lectura de data attributes del script tag
- Autorización con Koru App Manager

**Código actual (líneas 77-109 de widget.ts):**
```typescript
async start(): Promise<void> {
  const isDev = window.location.hostname === 'localhost' || ...;
  if (isDev) {
    const mockConfig: BookingWidgetConfig = { ... };
    await this.onInit(mockConfig);
    await this.onRender(mockConfig);
  }
}
```

**No es necesario** - El SDK maneja esto automáticamente.

### 3. **Falta integración con data attributes**
El SDK espera que el script tag tenga estos atributos:
```html
<script 
  src="https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js"
  data-website-id="ws_xxx"
  data-app-id="app_xxx"
  data-app-manager-url="https://app.koru.com"
></script>
```

Tu widget actual no lee estos atributos porque no usa el SDK.

### 4. **Error en el formulario de Koru**
El mensaje `<!-- Widget URL not configured in Koru -->` probablemente se debe a:
- El campo "Widget URL" no se guardó correctamente
- Falta el campo "Estado" (debe estar en "Activo" o "Published")
- El widget no responde correctamente al preview mode de Koru

## ✅ Solución: Refactorización Completa

### Cambios Necesarios

#### 1. **Refactorizar `widget.ts`**
Debe extender `KoruWidget` e implementar los 3 métodos abstractos:

```typescript
import { KoruWidget, WidgetConfig } from '@redclover/koru-sdk';
import { apiClient, Service, BookingResponse } from './api/client';
// ... otros imports

export interface BookingWidgetConfig extends WidgetConfig {
  layout?: 'list' | 'grid' | 'button';
  stepInterval?: number;
  accentColor?: string;
  notifyEmail?: string;
  displayMode?: 'inline' | 'modal';
  triggerText?: string;
  triggerPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export class BookingWidget extends KoruWidget {
  // Propiedades privadas
  private widgetContainer: HTMLDivElement | null = null;
  private modalOverlay: HTMLDivElement | null = null;
  private triggerButton: HTMLButtonElement | null = null;
  private currentStep: Step = 'service';
  private services: Service[] = [];
  private selectedService: Service | null = null;
  private selectedDate: string = '';
  private selectedTime: string = '';
  private bookingResult: BookingResponse | null = null;
  private isOpen: boolean = false;

  // Componentes
  private serviceSelector: ServiceSelector | null = null;
  private dateTimePicker: DateTimePicker | null = null;
  private customerForm: CustomerForm | null = null;
  private confirmation: Confirmation | null = null;

  constructor() {
    super({ 
      name: 'koru-booking', 
      version: '1.0.0',
      options: {
        debug: true,
        cache: true,
        analytics: false
      }
    });
    this.log('BookingWidget constructor called');
  }

  /**
   * Lifecycle hook: Initialize widget state
   */
  async onInit(config: WidgetConfig): Promise<void> {
    this.log('onInit called with config:', config);
    
    try {
      this.services = await apiClient.getServices();
      this.log('Services loaded:', this.services);
    } catch (error) {
      this.log('Error loading services:', error);
      throw error;
    }
  }

  /**
   * Lifecycle hook: Render widget UI
   */
  async onRender(config: WidgetConfig): Promise<void> {
    this.log('onRender called');
    const typedConfig = config as BookingWidgetConfig;
    const displayMode = typedConfig.displayMode || 'inline';

    if (displayMode === 'modal') {
      this.renderModalMode(typedConfig);
    } else {
      this.renderInlineMode(typedConfig);
    }
  }

  /**
   * Lifecycle hook: Cleanup
   */
  async onDestroy(): Promise<void> {
    this.clearCurrentComponent();
    this.widgetContainer?.remove();
    this.modalOverlay?.remove();
    this.triggerButton?.remove();
    this.widgetContainer = null;
    this.modalOverlay = null;
    this.triggerButton = null;
    this.log('Widget destroyed');
  }

  /**
   * Optional: Update config without full re-render
   */
  async onConfigUpdate(config: WidgetConfig): Promise<void> {
    this.log('Config updated', config);
    await this.renderStep(config as BookingWidgetConfig);
  }

  // ... resto de métodos privados (renderModalMode, renderInlineMode, etc.)
}
```

#### 2. **Actualizar `index.ts`**
Simplificar el entry point:

```typescript
import { BookingWidget } from './widget';

export { BookingWidget };
export type { Service, BookingRequest, BookingResponse } from './api/client';

// Auto-start cuando se carga como script
if (typeof window !== 'undefined') {
  const widget = new BookingWidget();
  widget.start();
}
```

#### 3. **Actualizar `apiClient` para usar config dinámico**
El backend URL debe venir del config de Koru, no de variables de entorno:

```typescript
// En api/client.ts
export const createApiClient = (baseURL: string) => {
  return {
    async getServices(): Promise<Service[]> {
      const response = await fetch(`${baseURL}/api/services`);
      // ...
    },
    // ...
  };
};

// En widget.ts, dentro de onInit:
async onInit(config: WidgetConfig): Promise<void> {
  const typedConfig = config as BookingWidgetConfig;
  const apiUrl = typedConfig.apiUrl || import.meta.env.VITE_BACKEND_API_URL;
  this.apiClient = createApiClient(apiUrl);
  this.services = await this.apiClient.getServices();
}
```

#### 4. **Actualizar el Schema de Configuración**
Agregar el campo `apiUrl` al schema JSON:

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
  // ... resto de campos
]
```

## 📋 Checklist de Implementación

- [ ] Refactorizar `widget.ts` para extender `KoruWidget`
- [ ] Implementar `onInit`, `onRender`, `onDestroy`
- [ ] Eliminar el bypass manual de desarrollo
- [ ] Actualizar `apiClient` para recibir URL dinámica
- [ ] Actualizar `index.ts`
- [ ] Rebuild del widget (`npm run build`)
- [ ] Verificar que el UMD bundle se genera correctamente
- [ ] Actualizar el schema JSON en Koru con el campo `apiUrl`
- [ ] Verificar que el campo "Estado" esté en "Activo"
- [ ] Probar el preview mode en Koru

## 🎯 Datos Finales para el Formulario de Koru

| Campo | Valor |
|-------|-------|
| **Nombre de la App** | `Koru Booking` |
| **Descripción** | `Sistema de reservas online con calendario en tiempo real` |
| **URL del Logo** | `https://placehold.co/400x400/00C896/ffffff?text=KB` |
| **Is this a widget app?** | ✅ ON |
| **Widget URL** | `https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js` |
| **Version** | `1.0.0` |
| **Estado** | `Activo` / `Published` |

## 🔍 Verificación Post-Deploy

Después de refactorizar y hacer build, verifica:

1. **El bundle UMD exporta correctamente:**
```javascript
// En la consola del navegador:
console.log(window.KoruBookingWidget);
// Debe mostrar la clase
```

2. **El widget responde al preview mode:**
```javascript
window.__KORU_PREVIEW_CONFIG__ = {
  apiUrl: "http://localhost:4000",
  layout: "list",
  accentColor: "#00C896"
};
```

3. **Los data attributes se leen correctamente:**
El SDK debe leer automáticamente `data-website-id`, `data-app-id`, `data-app-manager-url`.
