# Checklist de Migración a PostgreSQL (Supabase)

Este documento te guía paso a paso para migrar el backend de SQLite a PostgreSQL productivo.

## ✅ Tareas Completadas

- [x] **Schema actualizado**: `prisma/schema.prisma` ahora usa PostgreSQL
- [x] **Variables de entorno validadas**: Nuevo sistema de validación con Zod en `src/config/env.ts`
- [x] **.env.example sanitizado**: Credenciales reemplazadas con placeholders seguros
- [x] **Scripts de setup creados**: `scripts/setup-database.sh` y `scripts/setup-database.ps1`
- [x] **Script SQL alternativo**: `prisma/init_supabase.sql` para crear tablas manualmente
- [x] **Seed script**: `prisma/seed.ts` para poblar datos iniciales
- [x] **Documentación**: `SETUP_SUPABASE.md` con instrucciones detalladas

## 📋 Tareas Pendientes (Requieren Acción del Usuario)

### 1. Configurar Proyecto Supabase

**Opciones:**

#### Opción A: Usar proyecto existente
- [ ] Ir a [https://app.supabase.com](https://app.supabase.com)
- [ ] Resetear contraseña de la base de datos si es necesario
- [ ] Copiar nuevas credenciales

#### Opción B: Crear proyecto nuevo
- [ ] Ir a [https://app.supabase.com](https://app.supabase.com)
- [ ] Clic en "New Project"
- [ ] Elegir nombre y contraseña segura
- [ ] Elegir región (preferiblemente cercana a tus usuarios)
- [ ] Esperar ~2 minutos a que el proyecto esté listo

### 2. Obtener Credenciales

- [ ] En Supabase Dashboard, ir a: **Settings > Database**
- [ ] Copiar la **Connection String** (URI mode)
- [ ] En **Settings > API**, copiar:
  - Project URL
  - anon/public key

### 3. Actualizar Variables de Entorno

- [ ] Copiar `.env.example` a `.env`:
  ```bash
  cp .env.example .env
  ```

- [ ] Editar `.env` con tus credenciales reales:
  ```bash
  DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.xxx.supabase.co:5432/postgres
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=xxx
  ADMIN_EMAIL=tu-email@dominio.com
  ```

### 4. Instalar Dependencias (si es necesario)

```bash
npm install
```

### 5. Ejecutar Migraciones

**Opción A: Usar script automático (Recomendado)**

En **Windows (PowerShell)**:
```powershell
cd backend
.\scripts\setup-database.ps1
```

En **Linux/Mac**:
```bash
cd backend
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**Opción B: Manualmente**

```bash
# Generar cliente Prisma
npx prisma generate

# Crear y aplicar migración
npx prisma migrate dev --name init_postgresql

# Poblar datos iniciales
npm run prisma:seed
```

**Opción C: SQL directo en Supabase**

1. Ir a **SQL Editor** en Supabase Dashboard
2. Copiar contenido de `prisma/init_supabase.sql`
3. Pegar y ejecutar
4. Verificar que las tablas se crearon

### 6. Verificar que Todo Funciona

- [ ] Abrir Prisma Studio:
  ```bash
  npx prisma studio
  ```
- [ ] Verificar que las tablas existen y tienen datos
- [ ] Iniciar el servidor:
  ```bash
  npm run dev
  ```
- [ ] Hacer una petición de prueba:
  ```bash
  curl http://localhost:4000/health
  curl http://localhost:4000/api/services
  ```

### 7. Pruebas de Transacciones

- [ ] Crear una reserva desde el widget o backoffice
- [ ] Intentar crear reserva duplicada (debe fallar)
- [ ] Verificar que no hay race conditions

### 8. Actualizar Backoffice y Widget

- [ ] Actualizar `.env` en `backoffice/` con nueva API URL si cambió
- [ ] Actualizar `.env` en `widget/` con nueva API URL si cambió
- [ ] Probar flujo completo end-to-end

## 🔒 Checklist de Seguridad

- [ ] El archivo `.env` NO está en git (verificar `.gitignore`)
- [ ] Credenciales viejas fueron rotadas/deshabilitadas
- [ ] Variables de entorno se validan al inicio (gracias a `src/config/env.ts`)
- [ ] CORS_ORIGIN configurado correctamente para producción
- [ ] Contraseña de Supabase es fuerte (mínimo 12 caracteres)

## 📊 Verificación de Performance

- [ ] Índices están creados correctamente:
  - `Service.active`
  - `Schedule.enabled`
  - `Booking.date`
  - `Booking.status`
  - `Booking(serviceId, date, time)` (unique)

- [ ] Queries son eficientes (sin N+1 problems)
- [ ] Transacciones funcionan correctamente

## 🚀 Deployment (Próximos Pasos)

Una vez que todo funcione localmente:

- [ ] Elegir plataforma de hosting (Railway, Render, Fly.io, etc.)
- [ ] Configurar variables de entorno en la plataforma
- [ ] Configurar CORS con dominios reales
- [ ] Ejecutar `npm run build` y deployar
- [ ] Ejecutar migraciones en producción: `npm run prisma:migrate:deploy`
- [ ] Configurar CI/CD (opcional)

## 🐛 Troubleshooting

### Error: Can't reach database server

**Causa:** DATABASE_URL incorrecta o proyecto pausado

**Solución:**
1. Verificar que la URL es correcta
2. En Supabase Dashboard, verificar que el proyecto está activo
3. Si está pausado, hacer clic en "Resume project"
4. Esperar 1-2 minutos y volver a intentar

### Error: P1001 Authentication failed

**Causa:** Contraseña incorrecta en DATABASE_URL

**Solución:**
1. Ir a Supabase: Settings > Database > Database Password
2. Resetear contraseña
3. Actualizar `.env` con la nueva contraseña

### Error: Zod validation failed

**Causa:** Variables de entorno faltantes o con formato incorrecto

**Solución:**
1. Revisar el error específico en consola
2. Verificar que todas las variables en `.env.example` están en `.env`
3. Verificar formato (URLs deben ser válidas, emails deben tener @, etc.)

### Transacciones no previenen duplicados

**Causa:** SQLite no soporta transacciones correctamente

**Solución:**
- Ya está resuelto al migrar a PostgreSQL
- Verificar que el constraint `@@unique([serviceId, date, time])` existe en la tabla Booking

## 📚 Referencias

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Migraciones de Prisma](https://www.prisma.io/docs/guides/migrate)
- `SETUP_SUPABASE.md` en este directorio

## ✅ ¿Todo Listo?

Si completaste todos los checkboxes, tu backend está listo para producción (en cuanto a base de datos).

**Próximas mejoras recomendadas:**
1. Implementar rate limiting (ver `SENIOR_ARCHITECT_ANALYSIS.md`)
2. Implementar logging estructurado con Winston/Pino
3. Agregar tests automatizados (mínimo 50% coverage)
4. Configurar monitoring (Sentry, New Relic, etc.)
