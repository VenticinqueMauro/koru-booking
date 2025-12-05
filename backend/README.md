# Koru Booking Backend API

API REST para el sistema de gestión de reservas Koru Booking.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

Crea un archivo `.env` basado en `.env.example` y configura tu DATABASE_URL de Supabase.

```bash
cp .env.example .env
```

### 3. Ejecutar migraciones

```bash
npm run prisma:push
# o
npm run prisma:migrate
```

### 4. Iniciar servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en http://localhost:4000

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
npm run dev              # Desarrollo con watch mode
npm run build            # Compilar TypeScript
npm start                # Iniciar en producción
npm run prisma:generate  # Generar Prisma Client
npm run prisma:migrate   # Crear y aplicar migraciones
npm run prisma:studio    # Abrir Prisma Studio (GUI)
npm run prisma:push      # Sincronizar schema (desarrollo)
```

## 🗄️ Base de Datos

Tablas principales:
- **Service**: Servicios ofrecidos
- **Schedule**: Horarios semanales (7 registros, uno por día)
- **Booking**: Reservas de clientes
- **WidgetSettings**: Configuración del widget

## 🔐 Seguridad

- Validación de datos con Zod
- Validación atómica de conflictos (transacciones)
- Unique constraints en base de datos
- CORS configurado

## 📧 Notificaciones

El sistema envía emails automáticos mediante NodeMailer:
- Confirmación al cliente
- Notificación al administrador

Configura las variables SMTP en `.env`.

## 🐛 Debugging

Activa logs de Prisma en desarrollo:
- Las queries SQL se logean en consola
- Los errores incluyen stack traces

## 📄 Licencia

MIT © Red Clover
