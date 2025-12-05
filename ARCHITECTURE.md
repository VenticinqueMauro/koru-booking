# Arquitectura del Sistema: Koru Booking

## 🏗️ Visión General

Koru Booking es un sistema de gestión de reservas distribuido en **3 componentes independientes**:

1. **Widget (Storefront)**: Interfaz para clientes finales
2. **Backend API**: Lógica de negocio y persistencia
3. **Backoffice (Admin Panel)**: Panel de administración

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE FINAL (Storefront)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Widget (Vanilla TypeScript + Koru SDK)                  │  │
│  │  • Wizard de 4 pasos                                     │  │
│  │  • Consulta slots disponibles                            │  │
│  │  • Crea reservas                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server                                          │  │
│  │  • Slot Calculator (algoritmo de disponibilidad)         │  │
│  │  • Conflict Validator (prevención de duplicados)         │  │
│  │  • Email Service (notificaciones)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Prisma ORM                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase PostgreSQL                                     │  │
│  │  • Service, Schedule, Booking, WidgetSettings            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↑ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                  ADMINISTRADOR (Backoffice)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React SPA (Koru React SDK)                              │  │
│  │  • Gestión de servicios                                  │  │
│  │  • Configuración de horarios                             │  │
│  │  • Agenda de reservas                                    │  │
│  │  • Personalización del widget                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Reserva (Happy Path)

1. **Cliente abre widget** en la tienda
2. **Selecciona servicio** (ej: "Corte de Pelo")
3. **Selecciona fecha** (ej: "2024-01-15")
4. **Widget consulta backend**: `GET /api/slots?serviceId=xxx&date=2024-01-15`
5. **Backend calcula slots disponibles**:
   - Lee horario comercial del día
   - Lee reservas existentes
   - Aplica duración del servicio + buffer
   - Filtra slots ocupados y pasados
6. **Widget muestra horarios disponibles**
7. **Cliente selecciona hora** (ej: "10:00")
8. **Cliente completa formulario** (nombre, email, teléfono)
9. **Widget envía reserva**: `POST /api/bookings`
10. **Backend valida y crea reserva**:
    - Inicia transacción
    - Verifica que el slot sigue disponible (lock)
    - Crea registro en DB
    - Commit
11. **Backend envía emails**:
    - Confirmación al cliente
    - Notificación al admin
12. **Widget muestra confirmación** con opción de añadir a calendario

## 🧠 Algoritmo de Cálculo de Slots

### Inputs
- `serviceId`: ID del servicio
- `date`: Fecha en formato YYYY-MM-DD

### Proceso

```typescript
function calculateAvailableSlots(serviceId, date) {
  // 1. Obtener servicio (duration, buffer)
  const service = db.service.findById(serviceId);
  
  // 2. Obtener horario del día (startTime, endTime, breaks)
  const dayOfWeek = date.getDay(); // 0-6
  const schedule = db.schedule.findByDay(dayOfWeek);
  
  // 3. Generar todos los slots posibles
  const allSlots = generateTimeSlots(
    schedule.startTime, // "09:00"
    schedule.endTime,   // "18:00"
    15                  // Intervalo de 15 min
  );
  
  // 4. Obtener reservas existentes del día
  const bookings = db.booking.findMany({ date, status: 'confirmed' });
  
  // 5. Marcar slots ocupados (considerando duración + buffer)
  const occupiedSlots = new Set();
  bookings.forEach(booking => {
    const totalDuration = booking.service.duration + booking.service.buffer;
    const occupiedRange = [booking.time, booking.time + totalDuration];
    
    allSlots.forEach(slot => {
      if (overlaps(slot, occupiedRange)) {
        occupiedSlots.add(slot);
      }
    });
  });
  
  // 6. Filtrar slots disponibles
  const availableSlots = allSlots.filter(slot => {
    // Eliminar ocupados
    if (occupiedSlots.has(slot)) return false;
    
    // Si es hoy, eliminar slots pasados
    if (isToday(date) && isPast(slot)) return false;
    
    // Eliminar slots en el break
    if (inBreak(slot, schedule.breakStart, schedule.breakEnd)) return false;
    
    return true;
  });
  
  return availableSlots;
}
```

## 🔒 Prevención de Conflictos (Race Conditions)

### Problema
Dos usuarios intentan reservar el mismo horario simultáneamente.

### Solución: Transacciones Atómicas

```typescript
async function createBooking(serviceId, date, time, customerData) {
  return prisma.$transaction(async (tx) => {
    // 1. Verificar si existe reserva (con lock)
    const existing = await tx.booking.findUnique({
      where: { serviceId_date_time: { serviceId, date, time } }
    });
    
    if (existing) {
      throw new Error('Horario ocupado');
    }
    
    // 2. Crear reserva
    const booking = await tx.booking.create({ data: {...} });
    
    return booking;
  });
}
```

**Garantías**:
- Solo una transacción puede leer y escribir a la vez
- Si dos requests llegan simultáneamente, la segunda obtendrá error
- Unique constraint en DB como última línea de defensa

## 📧 Sistema de Notificaciones

### Emails Enviados

1. **Al Cliente**:
   - Confirmación de reserva
   - Detalles: servicio, fecha, hora
   - Botón "Añadir a Calendario"

2. **Al Administrador**:
   - Alerta de nueva reserva
   - Datos del cliente
   - Enlace al panel admin

### Implementación

```typescript
// Envío asíncrono (no bloqueante)
emailService.sendBookingConfirmation(bookingData)
  .catch(err => console.error('Error sending emails:', err));

// La reserva se crea aunque falle el email
```

## 🗄️ Modelo de Datos

### Service
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255)
duration    INTEGER         -- minutos
price       DECIMAL(10,2)   -- opcional
buffer      INTEGER         -- minutos
imageUrl    VARCHAR(500)    -- opcional
active      BOOLEAN
```

### Schedule
```sql
id          UUID PRIMARY KEY
dayOfWeek   INTEGER UNIQUE  -- 0-6
enabled     BOOLEAN
startTime   VARCHAR(5)      -- "09:00"
endTime     VARCHAR(5)      -- "18:00"
breakStart  VARCHAR(5)      -- "13:00" (opcional)
breakEnd    VARCHAR(5)      -- "14:00" (opcional)
```

### Booking
```sql
id            UUID PRIMARY KEY
serviceId     UUID REFERENCES Service(id)
date          DATE
time          VARCHAR(5)    -- "10:00"
customerName  VARCHAR(255)
customerEmail VARCHAR(255)
customerPhone VARCHAR(50)   -- opcional
notes         TEXT          -- opcional
status        VARCHAR(20)   -- confirmed, cancelled, completed

UNIQUE (serviceId, date, time)  -- Prevenir duplicados
```

## 🎨 Personalización del Widget

### Configuración (WidgetSettings)

```typescript
{
  layout: 'list' | 'grid' | 'button',  // Diseño de servicios
  stepInterval: 15 | 30 | 60,          // Intervalo de slots
  accentColor: '#00C896',              // Color principal
  notifyEmail: 'admin@example.com',   // Email de notificaciones
  timezone: 'America/Mexico_City'      // Zona horaria
}
```

## 🚀 Escalabilidad

### Optimizaciones Implementadas

1. **Caching en Frontend**: 
   - Widget cachea servicios por 1 hora
   - Reduce llamadas al backend

2. **Índices en Base de Datos**:
   - `Booking.date` (queries por fecha muy frecuentes)
   - `Booking.status` (filtrado por estado)
   - `Service.active` (solo servicios activos)

3. **Queries Eficientes**:
   - Solo se consultan reservas del día específico
   - Include selective en Prisma

### Limitaciones Conocidas (V1)

- No soporta múltiples zonas horarias simultáneas
- No hay sistema de waitlist
- No hay recordatorios automáticos

## 🔮 Roadmap (Futuras Versiones)

### V2
- [ ] Integración con Google Calendar (sync bidireccional)
- [ ] Recordatorios por email (24h antes)
- [ ] Sistema de waitlist
- [ ] Pagos online integrados

### V3
- [ ] Multi-tenant (múltiples comercios)
- [ ] App móvil nativa
- [ ] Analytics avanzado
- [ ] Integraciones con Zapier

## 📚 Referencias Técnicas

- **Koru React SDK**: https://www.npmjs.com/package/@redclover/koru-react-sdk
- **Koru Widget SDK**: https://www.npmjs.com/package/@redclover/koru-sdk
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs

## 👥 Equipo

Generado por **Koru Orchestrator** - Sistema de scaffolding inteligente del ecosistema Koru.
