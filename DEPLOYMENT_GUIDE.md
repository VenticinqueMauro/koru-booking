# Deployment Automatizado a Vercel (Sin Conexión GitHub)

## 📋 Contexto

Este documento describe cómo deployar el proyecto Koru Booking a Vercel **sin conectar GitHub**, ya que el repositorio es privado de la empresa y no tienen plan de pago en GitHub.

La solución utiliza el **Vercel CLI** para hacer deployments manuales pero **automatizados mediante scripts**.

---

## ✅ Estado Actual

- ✅ Backend deployado en Vercel (serverless functions)
- ✅ Backoffice deployado en Vercel (static site)
- ✅ Widget deployado en Vercel (static site)
- ✅ Scripts de deployment automatizado creados
- ✅ Configuraciones de vercel.json corregidas

---

## 🚀 Deployment Rápido (TL;DR)

### Deploy Todo (Backend + Backoffice + Widget)
```bash
npm run vercel:deploy
```

### Deploy Individual
```bash
node scripts/deploy-vercel.js backend      # Solo backend
node scripts/deploy-vercel.js backoffice   # Solo backoffice
node scripts/deploy-vercel.js widget       # Solo widget
```

**Nota**: Los scripts individuales no están agregados a package.json pero puedes agregarlos si los usas frecuentemente.

---

## 📦 Prerequisitos

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
```

Esto abrirá el navegador para autenticarte con la cuenta de Red Clover Consultoria.

### 3. Verificar que estás logueado

```bash
vercel whoami
```

Debería mostrar tu usuario/team de Vercel.

---

## 🔧 Configuración Inicial (Solo Primera Vez)

### Backend

1. **Link del proyecto:**
```bash
cd backend
vercel link
```

Responder:
- **Set up and deploy?** → Yes
- **Which scope?** → Red Clover team
- **Link to existing project?** → Si ya existe, seleccionarlo. Si no, crear nuevo.
- **Project name?** → `koru-booking-backend`

2. **Configurar variables de entorno en Vercel Dashboard:**

Ir a: https://vercel.com/dashboard → `koru-booking-backend` → Settings → Environment Variables

Agregar para **Production**:

```env
NODE_ENV=production
# IMPORTANTE: Ambas URLs deben usar el pooler (puerto 6543)
# DATABASE_URL usa pgbouncer=true para queries
# DIRECT_DATABASE_URL NO usa pgbouncer para migraciones
DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@aws-1-us-east-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://ptxtuoqvjgpwknjmqido.supabase.co
SUPABASE_ANON_KEY=[OBTENER DE SUPABASE]
RESEND_API_KEY=re_HJv79qeu_Lq3eLZZZYMFsL3s1LTJJbeGa
EMAIL_FROM=booking@korusuite.com
KORU_API_URL=https://www.korusuite.com
KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
KORU_APP_SECRET=fea88b8d53d3be7b3672e1c41059d9f10f8b18e8fa4fbdfa2bec7805db68bf52
CORS_ORIGIN=https://koru-booking-widget.vercel.app,https://koru-booking-backoffice.vercel.app
```

**Importante:** Marcar como "Sensitive" las variables que contienen secretos.

---

### Backoffice

1. **Actualizar `.env.production`:**

Editar `backoffice/.env.production`:

```env
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

2. **Link del proyecto:**
```bash
cd backoffice
vercel link
```

Configuración:
- **Set up and deploy?** → Yes
- **Which scope?** → Red Clover team
- **Link to existing project?** → Si ya existe, seleccionarlo. Si no, crear nuevo.
- **Project name?** → `koru-booking-backoffice`

3. **Configurar variables de entorno en Vercel Dashboard:**

Ir a: https://vercel.com/dashboard → `koru-booking-backoffice` → Settings → Environment Variables

Agregar para **Production**:

```env
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

---

### Widget

1. **Actualizar `.env.production`:**

Editar `widget/.env.production`:

```env
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app
VITE_KORU_WEBSITE_ID=[tu-website-id]
VITE_KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
VITE_KORU_URL=https://www.korusuite.com
```

**Nota:** El widget NO incluye `/api` en la URL (lo agrega internamente).

2. **Link del proyecto:**
```bash
cd widget
vercel link
```

Configuración:
- **Set up and deploy?** → Yes
- **Which scope?** → Red Clover team
- **Link to existing project?** → Si ya existe, seleccionarlo. Si no, crear nuevo.
- **Project name?** → `koru-booking-widget`

3. **Configurar variables de entorno en Vercel Dashboard:**

Ir a: https://vercel.com/dashboard → `koru-booking-widget` → Settings → Environment Variables

Agregar para **Production**:

```env
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app
VITE_KORU_WEBSITE_ID=[tu-website-id]
VITE_KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
VITE_KORU_URL=https://www.korusuite.com
```

---

## 🎯 Workflow de Deployment

### Flujo Normal de Desarrollo

1. **Hacer cambios en el código**
2. **Commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin master
   ```

3. **Deploy a Vercel:**
   ```bash
   npm run vercel:deploy
   ```

   Esto ejecutará automáticamente:
   - ✅ Prisma client generation (backend)
   - ✅ Build de backoffice
   - ✅ Build de widget
   - ✅ Deploy de los 3 componentes a producción

**Nota importante sobre migraciones**: Las migraciones NO se ejecutan automáticamente durante el deploy inicial. Después del primer deployment, debes ejecutar las migraciones manualmente desde Vercel Dashboard o usando el CLI.

---

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run vercel:deploy` | Deploy completo (backend + backoffice + widget) a producción |
| `node scripts/deploy-vercel.js backend` | Deploy solo backend a producción |
| `node scripts/deploy-vercel.js backoffice` | Deploy solo backoffice a producción |
| `node scripts/deploy-vercel.js widget` | Deploy solo widget a producción |
| `npm run build:all` | Build local de backoffice y widget (sin deploy) |

---

## 🔍 Verificación Post-Deploy

### Backend
```bash
# Health check
curl https://koru-booking-backend.vercel.app/health

# Test endpoint
curl https://koru-booking-backend.vercel.app/api/services \
  -H "X-Koru-Website-Id: tu-website-id" \
  -H "X-Koru-App-Id: 034927e7-ebe2-4c6b-9c9d-9b56c453d807"
```

### Backoffice
- [ ] Login funciona
- [ ] Dashboard carga servicios
- [ ] Se pueden crear/editar servicios
- [ ] Se pueden ver bookings
- [ ] Configuración de widget funciona

### Widget
- [ ] Demo page carga correctamente
- [ ] Widget se renderiza
- [ ] Se pueden ver servicios disponibles
- [ ] Se puede seleccionar fecha y hora
- [ ] Se puede completar una reserva
- [ ] Se reciben emails de confirmación

---

## 🐛 Troubleshooting

### Error: "Vercel CLI not found"
```bash
npm install -g vercel
```

### Error: "Not authenticated"
```bash
vercel login
```

### Error: "Project not linked"
```bash
cd [backend|backoffice|widget]
vercel link
```

### Error: "Can't reach database" (Backend)
- Verificar que `DATABASE_URL` tenga `?pgbouncer=true&connection_limit=1`
- Verificar que la conexión sea a puerto 6543 (pooler)
- **IMPORTANTE**: `DIRECT_DATABASE_URL` también debe usar el pooler (puerto 6543), NO el puerto directo 5432
- El puerto directo (5432) no es accesible públicamente, solo desde IPs whitelisted

### Error: "Failed to fetch" (Frontend)
- Verificar que `VITE_BACKEND_API_URL` sea correcto en las variables de entorno de Vercel
- Verificar que backend esté deployado y funcionando
- Verificar CORS en backend

### Error: "CORS errors"
- Verificar `CORS_ORIGIN` en variables de Vercel del backend
- Incluir las URLs exactas de widget y backoffice
- Formato: `https://widget-url.vercel.app,https://backoffice-url.vercel.app`

### Build falla en frontend
```bash
# Probar build local primero
cd backoffice  # o widget
npm install
npm run build

# Si funciona local pero falla en Vercel, revisar:
# 1. Variables de entorno en Vercel Dashboard
# 2. Logs de build en Vercel Dashboard
```

### Error: "Header source pattern is invalid" (Widget)
**Causa**: Vercel no acepta el patrón `/*.js` en headers.

**Solución**: Usar `/(.*)\\.js` en su lugar. Ya está corregido en `widget/vercel.json`.

### Error: "Cannot use builds and functions together" (Backend)
**Causa**: Conflicto entre propiedades `builds` y `functions` en vercel.json.

**Solución**: Usar solo `functions` con `rewrites` (API moderna). Ya está corregido en `backend/vercel.json`.

### Error: "Cannot mix routes with rewrites/redirects/headers" (Frontend)
**Causa**: Vercel no permite mezclar `routes` (API vieja) con `rewrites/headers` (API nueva).

**Solución**: Usar solo `rewrites` y `headers`. Ya está corregido en ambos frontends.

---

## 🎓 Ventajas de Este Approach

### ✅ Pros
1. **No requiere GitHub conectado** - Funciona con repos privados sin plan de pago
2. **Automatizado** - Un solo comando deploya todo
3. **Control total** - Decides cuándo deployar
4. **Preview deployments** - Puedes probar antes de producción
5. **Rollback fácil** - Vercel guarda historial de deployments

### ⚠️ Contras
1. **No auto-deploy** - Debes ejecutar el comando manualmente después de cada push
2. **Requiere Vercel CLI** - Todos los devs necesitan tener Vercel CLI instalado

---

## 🔄 Migración desde Netlify

### Paso 1: Verificar Backend en Vercel
Asegúrate de que el backend esté funcionando correctamente en Vercel antes de migrar el frontend.

### Paso 2: Deploy Frontend a Vercel
```bash
npm run vercel:deploy
```

### Paso 3: Probar Todo
Verifica que backoffice y widget funcionen correctamente con el nuevo backend.

### Paso 4: Mantener Netlify como Backup (1 semana)
- NO eliminar deployments de Netlify inmediatamente
- Mantenerlos activos por 1 semana
- Si todo funciona bien en Vercel, eliminar Netlify deployments

### Paso 5: Cleanup
Una vez confirmado que todo funciona:
```bash
# Remover scripts de Netlify del package.json
# Eliminar sites en Netlify Dashboard
# Actualizar documentación
```

---

## 📊 URLs de Producción

Una vez deployado, tus URLs serán:

- **Backend:** `https://koru-booking-backend.vercel.app`
- **Backoffice:** `https://koru-booking-backoffice.vercel.app`
- **Widget:** `https://koru-booking-widget.vercel.app`

**Importante:** Actualizar `CORS_ORIGIN` en el backend con estas URLs exactas.

---

## 🔐 Seguridad

### Variables de Entorno
- ✅ Todas las variables sensibles están en Vercel Dashboard
- ✅ Marcadas como "Sensitive" para ocultarlas en logs
- ✅ No están en el código ni en GitHub
- ✅ Cada ambiente (Preview/Production) tiene sus propias variables

### CORS
- ✅ Backend solo acepta requests de URLs específicas
- ✅ Configurado en `CORS_ORIGIN` environment variable
- ✅ Actualizar cuando cambien las URLs de frontend

---

## 📚 Recursos

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Deployments](https://vercel.com/docs/deployments/overview)

---

## 💡 Tips

### Deployment más rápido
Si solo cambiaste backend:
```bash
npm run vercel:backend
```

Si solo cambiaste frontend:
```bash
npm run vercel:backoffice  # o vercel:widget
```

### Ver logs en tiempo real
```bash
vercel logs [deployment-url]
```

### Listar deployments
```bash
cd backend  # o backoffice, widget
vercel ls
```

### Rollback a deployment anterior
```bash
# En Vercel Dashboard → Project → Deployments → Click en deployment anterior → Promote to Production
```

---

## ✅ Checklist de Primera Vez

- [ ] Vercel CLI instalado (`npm install -g vercel`)
- [ ] Autenticado en Vercel (`vercel login`)
- [ ] Backend linked (`cd backend && vercel link`)
- [ ] Backoffice linked (`cd backoffice && vercel link`)
- [ ] Widget linked (`cd widget && vercel link`)
- [ ] Variables de entorno configuradas en Vercel Dashboard (backend)
- [ ] Variables de entorno configuradas en Vercel Dashboard (backoffice)
- [ ] Variables de entorno configuradas en Vercel Dashboard (widget)
- [ ] `.env.production` actualizado en backoffice
- [ ] `.env.production` actualizado en widget
- [ ] Primer deployment exitoso (`npm run vercel:deploy`)
- [ ] Verificación post-deploy completada
- [ ] CORS actualizado en backend con nuevas URLs

---

**¡Listo!** Ahora puedes deployar con un solo comando: `npm run vercel:deploy` 🚀
