# Migración de Backoffice y Widget a Vercel

## Estado Actual
✅ Backoffice y Widget configurados para Netlify
✅ Configuraciones de Vercel creadas (vercel.json)
✅ Backend ya migrado a Vercel (pendiente de deploy)

---

## Orden de Ejecución

**IMPORTANTE:** Solo proceder con frontend DESPUÉS de que el backend esté deployado en Vercel y funcionando.

1. Primero: Deploy backend en Vercel (ver `backend/VERCEL_SETUP.md`)
2. Obtener URL de producción del backend (ej: `https://koru-booking-backend.vercel.app`)
3. Luego: Deploy backoffice y widget con la nueva URL

---

## Pasos para Backoffice

### 1. Actualizar .env.production

Editar `backoffice/.env.production`:

```bash
# Reemplazar con la URL real de tu backend en Vercel
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

### 2. Link Proyecto en Vercel

```bash
cd backoffice
vercel link
```

Configuración:
- **Set up and deploy?** → Yes
- **Which scope?** → Red Clover team
- **Link to existing project?** → No (crear nuevo)
- **Project name?** → `koru-booking-backoffice`
- **In which directory is your code located?** → `.`

### 3. Configurar Variables de Entorno en Vercel

Ir a Vercel Dashboard → Proyecto → Settings → Environment Variables

Agregar para **Production**:
```
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

### 4. Deploy de Prueba (Preview)

```bash
vercel
```

Probar la URL de preview que te dé Vercel.

### 5. Deploy a Producción

```bash
vercel --prod
```

### 6. Verificar

- [ ] Login funciona
- [ ] Dashboard carga servicios
- [ ] Se pueden crear/editar servicios
- [ ] Se pueden ver bookings
- [ ] Configuración de widget funciona

---

## Pasos para Widget

### 1. Actualizar .env.production

Editar `widget/.env.production`:

```bash
# Reemplazar con la URL real de tu backend en Vercel
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app
```

**Nota:** El widget NO incluye `/api` en la URL (lo agrega internamente).

### 2. Link Proyecto en Vercel

```bash
cd widget
vercel link
```

Configuración:
- **Set up and deploy?** → Yes
- **Which scope?** → Red Clover team
- **Link to existing project?** → No (crear nuevo)
- **Project name?** → `koru-booking-widget`
- **In which directory is your code located?** → `.`

### 3. Configurar Variables de Entorno en Vercel

Ir a Vercel Dashboard → Proyecto → Settings → Environment Variables

Agregar para **Production**:
```
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app
VITE_KORU_WEBSITE_ID=[tu-website-id]
VITE_KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
VITE_KORU_URL=https://www.korusuite.com
```

### 4. Deploy de Prueba (Preview)

```bash
vercel
```

Probar el widget en la URL de preview.

### 5. Deploy a Producción

```bash
vercel --prod
```

### 6. Verificar

- [ ] Demo page carga correctamente
- [ ] Widget se renderiza
- [ ] Se pueden ver servicios disponibles
- [ ] Se puede seleccionar fecha y hora
- [ ] Se puede completar una reserva
- [ ] Se reciben emails de confirmación

---

## Actualizar CORS en Backend

Una vez que backoffice y widget estén deployados en Vercel, actualizar la variable `CORS_ORIGIN` en el backend:

Ir a Vercel Dashboard → Backend Project → Settings → Environment Variables

Editar `CORS_ORIGIN`:
```
CORS_ORIGIN=https://[backoffice-url].vercel.app,https://[widget-url].vercel.app
```

Redeploy backend:
```bash
cd backend
vercel --prod
```

---

## Scripts de Deployment

Los scripts en `package.json` raíz ya están actualizados pero aún apuntan a Netlify. Cuando todo esté en Vercel, podemos actualizar:

```json
{
  "scripts": {
    "deploy:all": "npm run deploy:backend && npm run deploy:backoffice && npm run deploy:widget",
    "deploy:backend": "cd backend && vercel --prod",
    "deploy:backoffice": "cd backoffice && vercel --prod",
    "deploy:widget": "cd widget && vercel --prod"
  }
}
```

---

## Configurar Auto-Deploy (Opcional)

Para cada proyecto en Vercel Dashboard → Settings → Git:

**Backend:**
- Repository: `Red-Clover-Consultoria/koru-booking`
- Branch: `master`
- Root Directory: `backend/`

**Backoffice:**
- Repository: `Red-Clover-Consultoria/koru-booking`
- Branch: `master`
- Root Directory: `backoffice/`

**Widget:**
- Repository: `Red-Clover-Consultoria/koru-booking`
- Branch: `master`
- Root Directory: `widget/`

Con esto, cada push a `master` desplegará automáticamente los tres componentes.

---

## Mantener Netlify como Backup (1 semana)

- NO eliminar deployments de Netlify inmediatamente
- Mantenerlos activos por 1 semana
- Si todo funciona bien en Vercel, eliminar Netlify deployments

---

## Checklist Final de Migración Completa

### Backend
- [ ] Deployado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Conexión a base de datos funcionando
- [ ] Todos los endpoints responden correctamente

### Backoffice
- [ ] Deployado en Vercel
- [ ] Apunta al backend en Vercel
- [ ] Login funciona
- [ ] CRUD de servicios funciona
- [ ] Vista de bookings funciona

### Widget
- [ ] Deployado en Vercel
- [ ] Apunta al backend en Vercel
- [ ] Se renderiza correctamente
- [ ] Flujo de booking completo funciona
- [ ] Emails se envían correctamente

### CORS
- [ ] Backend tiene las nuevas URLs de Vercel en CORS_ORIGIN
- [ ] No hay errores de CORS en consola del navegador

### Cleanup
- [ ] Eliminar deployments de Netlify
- [ ] Eliminar deployment de Render (backend)
- [ ] Actualizar scripts de package.json raíz
- [ ] Documentación actualizada (CLAUDE.md)

---

## Beneficios de la Migración Completa

1. **Un solo proveedor:** Todo en Vercel, facturación y gestión simplificada
2. **Auto-deploy:** Git push → Deploy automático de los 3 componentes
3. **Preview deployments:** Cada PR tiene su preview environment completo
4. **Mejor DX:** CLI unificado, logs centralizados, analytics integrados
5. **Costo optimizado:** Pay-per-use en los 3 componentes
6. **Mejor performance:** Edge network global para frontend, serverless para backend

---

## Troubleshooting

### Error: "Failed to fetch" en backoffice/widget
- Verificar que `VITE_BACKEND_API_URL` sea correcto
- Verificar que backend esté deployado y funcionando
- Verificar CORS en backend

### Error: "Network Error"
- Verificar que las URLs no tengan barras finales duplicadas
- Backend: debe terminar en `/api`
- Widget: NO debe terminar en `/api`

### Widget no se carga
- Verificar CORS headers en vercel.json del widget
- Verificar que `demo.html` se copió correctamente al dist

### Backoffice no hace routing
- Verificar SPA routing en vercel.json
- Verificar que el redirect a `/index.html` esté configurado

---

## URLs de Producción (Ejemplo)

Actualizar cuando tengas las URLs reales:

- Backend: `https://koru-booking-backend.vercel.app`
- Backoffice: `https://koru-booking-backoffice.vercel.app`
- Widget: `https://koru-booking-widget.vercel.app`
