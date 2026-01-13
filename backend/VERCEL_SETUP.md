# Pasos Pendientes para Deploy en Vercel

## Estado Actual
✅ Código adaptado para Vercel serverless
✅ Configuración de Vercel creada (vercel.json)
✅ Scripts de migración creados
✅ Variables de entorno locales actualizadas
✅ Conexión a base de datos probada y funcionando

## Pasos Pendientes (Requiere Acceso a Vercel)

### 1. Instalar Vercel CLI (Si no está instalado)
```bash
npm install -g vercel
```

### 2. Login en Vercel
```bash
vercel login
```
Esto abrirá el navegador para autenticarte con la cuenta de la empresa.

### 3. Link del Proyecto
Desde el directorio `backend/`:
```bash
cd backend
vercel link
```

Responder:
- **Set up and deploy?** → Yes
- **Which scope?** → Seleccionar cuenta/team de Red Clover
- **Link to existing project?** → No (crear nuevo)
- **Project name?** → `koru-booking-backend` (o el nombre que prefieran)
- **In which directory is your code located?** → `.` (directorio actual)

### 4. Configurar Variables de Entorno en Vercel

Ir a: https://vercel.com/dashboard → Proyecto → Settings → Environment Variables

Agregar las siguientes variables para **Production**:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@db.ptxtuoqvjgpwknjmqido.supabase.co:5432/postgres
SUPABASE_URL=https://5kF6Eeogx3k6W1S1.supabase.co
SUPABASE_ANON_KEY=[OBTENER DE SUPABASE]
RESEND_API_KEY=re_HJv79qeu_Lq3eLZZZYMFsL3s1LTJJbeGa
EMAIL_FROM=booking@korusuite.com
KORU_API_URL=https://www.korusuite.com
KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
KORU_APP_SECRET=fea88b8d53d3be7b3672e1c41059d9f10f8b18e8fa4fbdfa2bec7805db68bf52
CORS_ORIGIN=https://koru-booking-widget.netlify.app,https://koru-booking-backoffice.netlify.app
```

**Importante:** Marcar como "Sensitive" las variables que contienen secretos.

### 5. Deploy de Prueba (Preview)

```bash
cd backend
vercel
```

Esto creará un deployment de preview. Obtendrás una URL como:
`https://koru-booking-backend-xyz.vercel.app`

### 6. Probar Preview Deployment

```bash
# Probar health check
curl https://koru-booking-backend-xyz.vercel.app/health

# Probar con un endpoint real (necesitas headers de auth válidos)
curl https://koru-booking-backend-xyz.vercel.app/api/services \
  -H "X-Koru-Website-Id: tu-website-id" \
  -H "X-Koru-App-Id: 034927e7-ebe2-4c6b-9c9d-9b56c453d807"
```

### 7. Probar con Widget y Backoffice

Actualizar temporalmente en local el `.env` de widget y backoffice:
```bash
VITE_BACKEND_API_URL=https://koru-booking-backend-xyz.vercel.app/api
```

Probar el flujo completo de booking.

### 8. Deploy a Producción

Una vez probado el preview:

```bash
cd backend
npm run migrate:pre-deploy  # Ejecuta migraciones
vercel --prod              # Deploy a producción
```

Obtendrás la URL de producción (ejemplo: `https://koru-booking-backend.vercel.app`)

### 9. Actualizar Frontend

Actualizar los archivos `.env.production` de widget y backoffice:

**widget/.env.production:**
```
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

**backoffice/.env.production:**
```
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

### 10. Configurar Auto-Deploy (Opcional)

En Vercel Dashboard → Project Settings → Git:
- Conectar con el repositorio `Red-Clover-Consultoria/koru-booking`
- Branch: `master`
- Root Directory: `backend/`

Esto hará que cada push a `master` despliegue automáticamente.

### 11. Eliminar Dual-Repository

Una vez que Vercel esté funcionando y probado:

```bash
# Remover el remote "personal" (ya no es necesario)
git remote remove personal

# Verificar
git remote -v
```

Ahora solo necesitarás:
```bash
git push origin master  # Vercel auto-deploys
```

### 12. Mantener Render como Backup (1 semana)

- **NO eliminar** el deployment de Render inmediatamente
- Mantenerlo activo por 1 semana como backup
- Si todo funciona bien en Vercel, eliminar Render deployment

---

## Checklist de Verificación Post-Deploy

- [ ] `/health` responde correctamente
- [ ] `/api/services` retorna servicios
- [ ] `/api/schedules` retorna horarios
- [ ] `/api/slots` calcula slots disponibles
- [ ] Widget puede crear bookings
- [ ] Emails de confirmación se envían
- [ ] Backoffice muestra bookings
- [ ] No hay errores en Vercel logs
- [ ] Response times < 500ms (warm requests)
- [ ] Cold starts < 3 segundos

---

## Troubleshooting

### Error: "Can't reach database"
- Verificar que `DATABASE_URL` tenga `?pgbouncer=true&connection_limit=1`
- Verificar que la conexión sea a puerto 6543 (pooler)

### Error: "Connection pool timeout"
- Verificar `connection_limit=1` en DATABASE_URL
- Verificar que estés usando el pooler, no la conexión directa

### Error en migraciones
- Usar `DIRECT_DATABASE_URL` (puerto 5432) localmente
- Ejecutar `npm run migrate:pre-deploy` ANTES de deploy

### CORS errors
- Verificar `CORS_ORIGIN` en variables de Vercel
- Incluir las URLs exactas de widget y backoffice

---

## Contacto para Dudas

Si hay problemas durante el setup, consultar:
- Documentación de Vercel: https://vercel.com/docs
- Plan de migración completo: `C:\Users\Ezequiel\.claude\plans\binary-gathering-harp.md`
