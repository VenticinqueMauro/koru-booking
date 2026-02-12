# Integración del Widget Koru Booking

Este documento proporciona el código necesario para integrar el widget en tu sitio web.

## 📋 Código de Integración

### Modo Modal (Botón Flotante)

Copia y pega este código en tu sitio web, justo antes del cierre de `</body>`:

```html
<!-- Estilos del Widget -->
<link rel="stylesheet" href="https://production.koru-booking-widget.pages.dev/koru-booking-widget.css">

<!-- Koru Booking Widget -->
<script
  src="https://production.koru-booking-widget.pages.dev/koru-booking-widget.umd.js"
  data-website-id="TU_WEBSITE_ID"
  data-app-id="TU_APP_ID"
  data-app-manager-url="https://app-manager.vercel.app"
  async
></script>
```

### Modo Inline (Contenedor Específico)

Si quieres que el widget aparezca en un lugar específico de tu página:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Página con Widget</title>

  <!-- Estilos del Widget -->
  <link rel="stylesheet" href="https://production.koru-booking-widget.pages.dev/koru-booking-widget.css">
</head>
<body>
  <!-- Tu contenido -->
  <h1>Reserva tu cita</h1>

  <!-- Contenedor del widget -->
  <div id="widget-root"></div>

  <!-- Más contenido -->

  <!-- Script del Widget (al final del body) -->
  <script
    src="https://production.koru-booking-widget.pages.dev/koru-booking-widget.umd.js"
    data-website-id="TU_WEBSITE_ID"
    data-app-id="TU_APP_ID"
    data-app-manager-url="https://app-manager.vercel.app"
    async
  ></script>
</body>
</html>
```

## 🔑 Obtener Credenciales

Para obtener `TU_WEBSITE_ID` y `TU_APP_ID`:

1. Accede a [Koru Platform](https://www.korusuite.com)
2. Ve a tu configuración de aplicaciones
3. Copia los valores de:
   - **Website ID**: Identificador único de tu sitio web
   - **App ID**: Identificador de la aplicación Koru Booking

## ⚙️ Configuración

La configuración del widget (colores, posición, modo de visualización, etc.) se gestiona desde Koru Platform. No necesitas configurar nada en el código de integración.

## 🌐 URLs Disponibles

### Producción (recomendado)
```
https://production.koru-booking-widget.pages.dev/koru-booking-widget.umd.js
https://production.koru-booking-widget.pages.dev/koru-booking-widget.css
```

### Deployment Específico
Si necesitas usar un deployment específico de la rama production:
```
https://production.production.koru-booking-widget.pages.dev/koru-booking-widget.umd.js
https://production.production.koru-booking-widget.pages.dev/koru-booking-widget.css
```

## 📝 Ejemplo Completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barbería El Corte Perfecto</title>

  <!-- Estilos del Widget -->
  <link rel="stylesheet" href="https://production.koru-booking-widget.pages.dev/koru-booking-widget.css">

  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Barbería El Corte Perfecto</h1>
    <p>Reserva tu cita en línea</p>
  </div>

  <div class="content">
    <h2>Nuestros Servicios</h2>
    <p>Ofrecemos cortes de pelo profesionales, arreglo de barba y más.</p>

    <!-- El widget aparecerá como botón flotante -->
    <!-- No necesitas agregar un div específico en modo modal -->
  </div>

  <!-- Script del Widget -->
  <script
    src="https://production.koru-booking-widget.pages.dev/koru-booking-widget.umd.js"
    data-website-id="250ad662-1ceb-4de2-b0f3-ac6f7929e783"
    data-app-id="034927e7-ebe2-4c6b-9c9d-9b56c453d807"
    data-app-manager-url="https://app-manager.vercel.app"
    async
  ></script>
</body>
</html>
```

## 🐛 Solución de Problemas

### El widget no se carga

1. Verifica que las URLs sean correctas
2. Abre la consola del navegador (F12) y busca errores
3. Asegúrate de que los `data-website-id` y `data-app-id` sean correctos

### Error de CORS

Si ves errores de CORS en la consola:
1. Contacta al administrador del sistema
2. Asegúrate de que tu dominio esté autorizado en la configuración del backend

### El widget está en blanco

1. Verifica que haya servicios activos configurados en el backoffice
2. Revisa que el backend esté funcionando correctamente
3. Abre la consola del navegador para ver mensajes de debug

## 📚 Documentación Adicional

- [README del Widget](./README.md) - Documentación técnica completa
- [Koru Platform](https://www.korusuite.com) - Panel de administración
