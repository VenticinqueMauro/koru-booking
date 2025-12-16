# Koru Booking Backend API

API REST para el sistema de gestión de reservas Koru Booking.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase y Base de Datos

**⚠️ IMPORTANTE**: Este proyecto usa **PostgreSQL (Supabase)** en producción.

**Opción A: Setup Automático (Recomendado)**

Sigue la guía completa en [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) y usa el script:

```bash
# Windows PowerShell
.\scripts\setup-database.ps1

# Linux/Mac
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**Opción B: Setup Manual**

1. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Configura tus credenciales de Supabase en `.env`:
   - DATABASE_URL (Connection String)
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - ADMIN_EMAIL

3. Ejecuta las migraciones:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate:deploy
   npm run prisma:seed  # Opcional: datos de prueba
   ```

**Checklist completo**: Ver [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)

### 3. Iniciar servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en http://localhost:4000

**Health Check**: http://localhost:4000/health

## 📡 Endpoints

### Servicios

- `GET /api/services` - Lista servicios activos
- `GET /api/services/:id` - Obtener servicio específico
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio (soft delete)

### Horarios

- `GET /api/schedules` - Listar horarios semanales
- `POST /api/schedules` - Crear/actualizar horario

### Disponibilidad

- `GET /api/slots?serviceId=xxx&date=2024-01-15` - Obtener slots disponibles

### Reservas

- `GET /api/bookings` - Listar reservas (soporta filtros: ?date=2024-01-15&status=confirmed)
- `POST /api/bookings` - Crear reserva
- `PATCH /api/bookings/:id/cancel` - Cancelar reserva

## 🛠️ Scripts

```bash
# Desarrollo
npm run dev                    # Desarrollo con watch mode
npm run type-check             # Verificar tipos sin compilar

# Build & Deploy
npm run build                  # Compilar TypeScript
npm start                      # Iniciar en producción

# Database
npm run prisma:generate        # Generar Prisma Client
npm run prisma:migrate         # Crear y aplicar migración (dev)
npm run prisma:migrate:deploy  # Aplicar migraciones (producción)
npm run prisma:seed            # Poblar base de datos
npm run prisma:studio          # Abrir Prisma Studio (GUI)
npm run db:setup               # Setup completo: generate + migrate + seed
```

## 🗄️ Base de Datos

**Motor**: PostgreSQL (Supabase)

**Tablas principales**:
- **Service**: Servicios ofrecidos
- **Schedule**: Horarios semanales (7 registros, uno por día)
- **Booking**: Reservas de clientes
- **WidgetSettings**: Configuración del widget

**Características**:
- UUIDs como IDs
- Transacciones ACID completas
- Índices optimizados para queries frecuentes
- Unique constraints para prevenir duplicados
- Timestamps automáticos (createdAt, updatedAt)

## 🔐 Seguridad

- **Validación de variables de entorno**: Sistema de validación con Zod (failfast)
- **Validación de datos**: Todos los inputs validados con Zod schemas
- **Transacciones atómicas**: Prevención de race conditions en reservas
- **Unique constraints**: Base de datos previene duplicados
- **CORS configurado**: Solo orígenes permitidos
- **No credenciales en repo**: `.env.example` solo tiene placeholders

## 📧 Notificaciones

El sistema envía emails automáticos mediante **Resend**:
- Confirmación al cliente
- Notificación al administrador

**Configuración requerida**:
1. Obtén una API key en https://resend.com/api-keys
2. Verifica tu dominio en el dashboard de Resend
3. Configura `RESEND_API_KEY` y `EMAIL_FROM` en `.env`

**Importante**: El email configurado en `EMAIL_FROM` debe ser de un dominio verificado en Resend.

## 🐛 Debugging

Activa logs de Prisma en desarrollo:
- Las queries SQL se logean en consola
- Los errores incluyen stack traces

## 📄 Licencia

MIT © Red Clover
