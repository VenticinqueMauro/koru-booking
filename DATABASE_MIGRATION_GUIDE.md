# Guía de Migración de Base de Datos - Koru Booking

**Última actualización**: 2025-12-08
**Versión del sistema**: 1.0.0
**Base de datos actual**: PostgreSQL (Supabase)

---

## 📋 Tabla de Contenidos

1. [Información Actual](#información-actual)
2. [Cambios Realizados](#cambios-realizados)
3. [Configuración de Nueva Base de Datos](#configuración-de-nueva-base-de-datos)
4. [Migración a Otro Proveedor](#migración-a-otro-proveedor)
5. [Backup y Restauración](#backup-y-restauración)
6. [Troubleshooting](#troubleshooting)

---

## Información Actual

### Estado del Sistema

- **Motor de Base de Datos**: PostgreSQL 15+
- **Proveedor**: Supabase
- **ORM**: Prisma 5.22.0
- **Método de Conexión**: Connection Pooler (PgBouncer)
- **Puerto**: 6543 (pooler) / 5432 (directo)

### Estructura de Tablas

```
Service          - Servicios ofrecidos
Schedule         - Horarios semanales (7 días)
Booking          - Reservas de clientes
WidgetSettings   - Configuración del widget
```

### Archivos Importantes

```
backend/
├── prisma/
│   ├── schema.prisma              # Schema de la base de datos
│   ├── seed.ts                    # Datos iniciales
│   └── migrations/                # Historial de migraciones
├── src/
│   └── config/
│       └── env.ts                 # Validación de variables de entorno
├── .env                           # Variables de entorno (NO commitear)
├── .env.example                   # Template de variables
└── EJECUTAR_EN_SUPABASE.sql      # Script SQL alternativo
```

---

## Cambios Realizados

### 1. Migración SQLite → PostgreSQL

**Fecha**: 2025-12-08

**Archivo modificado**: `prisma/schema.prisma`

```prisma
// ANTES
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// DESPUÉS
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Razón**: Transacciones ACID completas, mejor concurrencia, preparado para producción.

### 2. Validación de Variables de Entorno

**Archivo nuevo**: `src/config/env.ts`

**Características**:
- Validación con Zod al inicio de la aplicación
- Fail-fast si falta configuración
- Type-safety en todo el código
- Mensajes de error claros

**Uso**:
```typescript
import { env } from './config/env.js';

// En lugar de process.env.PORT
const port = env.PORT;  // Type-safe y validado
```

### 3. Connection String para Supabase

**Formato Connection Pooler** (Recomendado para producción):
```bash
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Formato Directo** (Solo para migraciones):
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

### 4. Scripts de Automatización

**package.json - Nuevos scripts**:
```json
{
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:seed": "tsx prisma/seed.ts",
  "db:setup": "npm run prisma:generate && npm run prisma:migrate:deploy && npm run prisma:seed"
}
```

---

## Configuración de Nueva Base de Datos

### Opción 1: Cambiar a Otro Proyecto Supabase

1. **Crear nuevo proyecto en Supabase**:
   - Ir a https://supabase.com/dashboard
   - Clic en "New Project"
   - Anotar: nombre, región, contraseña

2. **Obtener credenciales**:
   ```
   Settings > Database > Connection string > URI
   Settings > API > Project URL y anon key
   ```

3. **Actualizar `.env`**:
   ```bash
   DATABASE_URL=postgresql://postgres.NEW_PROJECT:NEW_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   SUPABASE_URL=https://NEW_PROJECT.supabase.co
   SUPABASE_ANON_KEY=new_anon_key
   ```

4. **Ejecutar migraciones**:
   ```bash
   cd backend
   npm run db:setup
   ```

### Opción 2: Migrar a Railway

1. **Crear proyecto en Railway**:
   - Ir a https://railway.app
   - New Project > Provision PostgreSQL
   - Copiar DATABASE_URL

2. **Actualizar `.env`**:
   ```bash
   DATABASE_URL=postgresql://postgres:password@containers.railway.app:5432/railway
   ```

3. **Ejecutar migraciones**:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

### Opción 3: Migrar a Render

1. **Crear PostgreSQL en Render**:
   - Ir a https://render.com
   - New > PostgreSQL
   - Copiar Internal Database URL

2. **Actualizar `.env`**:
   ```bash
   DATABASE_URL=postgresql://user:password@dpg-xxxxx.render.com/dbname
   ```

3. **Ejecutar migraciones**:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

### Opción 4: PostgreSQL Local (Desarrollo)

1. **Instalar PostgreSQL**:
   ```bash
   # Windows (Chocolatey)
   choco install postgresql

   # Mac (Homebrew)
   brew install postgresql

   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql
   ```

2. **Crear base de datos**:
   ```bash
   createdb koru_booking_dev
   ```

3. **Actualizar `.env`**:
   ```bash
   DATABASE_URL=postgresql://postgres:password@localhost:5432/koru_booking_dev
   ```

4. **Ejecutar migraciones**:
   ```bash
   npm run db:setup
   ```

---

## Migración a Otro Proveedor

### Proceso General

```bash
# 1. Backup de datos actuales
npx prisma db pull
npx prisma db seed  # Esto crea seed.ts si no existe

# 2. Exportar datos (opcional)
npm install -D prisma-export
npx prisma-export --output backup.json

# 3. Actualizar DATABASE_URL en .env
# (ver opciones arriba)

# 4. Regenerar Prisma Client
npx prisma generate

# 5. Aplicar migraciones
npx prisma migrate deploy

# 6. Seed (poblar datos)
npm run prisma:seed

# 7. Verificar
npx prisma studio
```

### Checklist de Migración

- [ ] Backup de datos actual
- [ ] Nueva base de datos creada
- [ ] DATABASE_URL actualizada en `.env`
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] Seed ejecutado (si aplica)
- [ ] Verificado en Prisma Studio
- [ ] Servidor inicia sin errores
- [ ] Endpoints responden correctamente
- [ ] Prueba de creación de reserva
- [ ] Prueba de duplicados (debe fallar)

---

## Backup y Restauración

### Backup Automático (Supabase)

Supabase hace backups automáticos diarios. Configurar en:
```
Settings > Database > Backups
```

### Backup Manual (SQL Dump)

```bash
# Usando pg_dump (requiere PostgreSQL instalado)
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurar
psql DATABASE_URL < backup_20251208.sql
```

### Backup con Prisma

```bash
# Exportar schema
npx prisma db pull

# Exportar datos (usando seed)
npm run prisma:seed
```

### Migrar Datos entre Bases de Datos

**Opción A: Usar pgloader (PostgreSQL a PostgreSQL)**:
```bash
pgloader SOURCE_DATABASE_URL TARGET_DATABASE_URL
```

**Opción B: Dump y Restore**:
```bash
# 1. Exportar de origen
pg_dump SOURCE_URL > migration.sql

# 2. Importar a destino
psql TARGET_URL < migration.sql
```

**Opción C: Prisma Migrate**:
```bash
# 1. Desde base de datos antigua
npx prisma db pull
npx prisma migrate dev --name backup_old_db

# 2. Cambiar DATABASE_URL a nueva base de datos

# 3. Aplicar migraciones
npx prisma migrate deploy
```

---

## Variables de Entorno Requeridas

### Mínimas (Base de datos)

```bash
DATABASE_URL=postgresql://...
```

### Completas (Producción)

```bash
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Supabase (opcional)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=...
EMAIL_FROM=noreply@domain.com

# Admin
ADMIN_EMAIL=admin@domain.com

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

### Validación

El sistema valida automáticamente todas las variables al iniciar (ver `src/config/env.ts`).

Si falta alguna variable, el servidor fallará con mensaje claro:
```
❌ Environment validation failed:
  • DATABASE_URL: DATABASE_URL must be a PostgreSQL connection string
  • ADMIN_EMAIL: ADMIN_EMAIL must be a valid email
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Causas posibles**:
1. Proyecto Supabase pausado
2. Contraseña incorrecta
3. Firewall bloqueando conexión
4. Connection string incorrecta

**Soluciones**:
1. Verificar que proyecto esté activo en dashboard
2. Resetear contraseña y actualizar `.env`
3. Usar connection pooler (puerto 6543)
4. Verificar formato de connection string

### Error: "P1001: Can't reach database server"

**Solución**: Usar connection pooler en lugar de conexión directa:
```bash
# Cambiar de puerto 5432 a 6543
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Error: "Prisma Client not generated"

**Solución**:
```bash
npx prisma generate
```

### Error: "Environment validation failed"

**Solución**:
1. Verificar que `.env` existe
2. Copiar valores de `.env.example`
3. Completar todos los campos requeridos
4. Verificar formato (URLs deben ser válidas, emails con @, etc.)

### Tablas duplicadas (mayúsculas y minúsculas)

**Problema**: PostgreSQL es case-sensitive, puede haber `Service` y `services`.

**Solución**:
```sql
-- Eliminar tablas en minúsculas (si existen)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS widget_settings CASCADE;

-- Prisma usará las tablas con mayúsculas (Service, Booking, etc.)
```

### Migrations fuera de sync

**Solución**:
```bash
# Opción 1: Reset completo (CUIDADO: Borra datos)
npx prisma migrate reset

# Opción 2: Marcar migraciones como aplicadas
npx prisma migrate resolve --applied MIGRATION_NAME

# Opción 3: Crear nueva migración baseline
npx prisma migrate dev --name baseline
```

---

## Contacto y Soporte

Para problemas con la migración:

1. **Documentación de Prisma**: https://www.prisma.io/docs
2. **Documentación de Supabase**: https://supabase.com/docs
3. **Logs del servidor**: Revisar consola para errores específicos
4. **Prisma Studio**: `npx prisma studio` para inspeccionar datos

---

## Historial de Cambios

### 2025-12-08 - Migración a PostgreSQL
- Migrado de SQLite a PostgreSQL (Supabase)
- Implementada validación de variables de entorno
- Configurado connection pooler
- Scripts de automatización creados
- Documentación completa

### Futuro
- [ ] Migración a base de datos propia (si aplica)
- [ ] Configuración de réplicas (alta disponibilidad)
- [ ] Implementación de CDC (Change Data Capture)
- [ ] Configuración de backups incrementales

---

**Notas Importantes**:
- NUNCA commitear el archivo `.env` (ya está en `.gitignore`)
- Siempre hacer backup antes de migrar
- Verificar que las transacciones funcionan después de migrar
- Probar prevención de duplicados después de cada migración

**Tiempo estimado de migración**: 15-30 minutos
**Downtime esperado**: 2-5 minutos (solo durante cambio de DATABASE_URL)
