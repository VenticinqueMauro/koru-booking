# 🗓️ Koru Booking

Sistema completo de gestión de citas y reservas en tiempo real para el ecosistema Koru.

## 📦 Estructura del Proyecto

```
koru-booking/
├── backend/         # API REST (Node.js + Express + Prisma + Supabase)
├── backoffice/      # Panel Admin (React SPA)
├── widget/          # Widget embebible (Vanilla TypeScript)
├── dist/            # Build consolidado para deployment
├── scripts/         # Scripts de build y deployment
├── README.md        # Documentación principal
└── CLAUDE.md        # Instrucciones para Claude Code
```

## 🚀 Inicio Rápido

### 1. Backend API

```bash
cd backend
npm install
cp .env.example .env
# Configurar DATABASE_URL y variables SMTP en .env
npm run prisma:push
npm run dev
```

El backend estará en http://localhost:4000

### 2. Widget (Storefront)

```bash
cd widget
npm install
cp .env.example .env
# Configurar variables de Koru en .env
npm run dev
```

El widget demo estará en http://localhost:3001

### 3. Backoffice (Admin)

```bash
cd backoffice
npm install
cp .env.example .env
# Configurar variables de Koru en .env
npm run dev
```

El panel admin estará en http://localhost:3000

## ✨ Características

### Widget (Cliente Final)
- ✅ Wizard de 4 pasos intuitivo
- ✅ Calendario visual con disponibilidad en tiempo real
- ✅ Validación de formularios
- ✅ Responsive (móvil y desktop)
- ✅ Export a Google Calendar
- ✅ Bundle ultra-ligero (~2KB gzip)

### Backend API
- ✅ Algoritmo de cálculo de slots disponibles
- ✅ Validación atómica de reservas (previene conflictos)
- ✅ Sistema de notificaciones por email
- ✅ Gestión de buffers post-servicio
- ✅ API REST completa con TypeScript
- ✅ Prisma ORM + PostgreSQL (Supabase)

### Backoffice (Administrador)
- ✅ Dashboard con estadísticas
- ✅ Gestión de servicios (CRUD)
- ✅ Configuración de horarios semanales
- ✅ Agenda de reservas
- ✅ Personalización del widget
- ✅ Protegido con Koru React SDK

## 🎯 Casos de Uso

- **Salones de belleza**: Reservas de cortes, tintes, manicuras
- **Consultorios**: Citas médicas, terapias, consultas
- **Fitness**: Clases grupales, sesiones personales
- **Coworking**: Reserva de salas y espacios
- **Servicios profesionales**: Asesorías, consultorías

## 🔧 Stack Tecnológico

| Componente | Tecnologías |
|------------|-------------|
| Widget | Vanilla TypeScript, Koru SDK, Vite |
| Backend | Node.js, Express, Prisma, Supabase PostgreSQL |
| Backoffice | React, Koru React SDK, React Query, Vite |
| Email | NodeMailer (SMTP/SendGrid) |
| Validación | Zod |

## 📡 API Endpoints

### Servicios
- `GET /api/services` - Lista servicios activos
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio

### Disponibilidad
- `GET /api/slots?serviceId=xxx&date=2024-01-15` - Obtener slots disponibles

### Reservas
- `GET /api/bookings` - Listar reservas
- `POST /api/bookings` - Crear reserva
- `PATCH /api/bookings/:id/cancel` - Cancelar reserva

### Horarios
- `GET /api/schedules` - Listar horarios semanales
- `POST /api/schedules` - Crear/actualizar horario

## 🗄️ Modelos de Datos

### Service
Servicios ofrecidos (ej: "Corte de Pelo", "Consultoría")
- duration: Duración en minutos
- buffer: Tiempo de preparación post-servicio
- price: Precio (opcional)

### Schedule
Horarios de atención semanales (7 registros, uno por día)
- dayOfWeek: 0-6 (Domingo-Sábado)
- startTime / endTime: Horario comercial
- breakStart / breakEnd: Pausas opcionales

### Booking
Reservas de clientes
- Unique constraint: `(serviceId, date, time)` previene duplicados
- status: confirmed / cancelled / completed

## 🚀 Deployment

### Build Local

Construir todos los componentes:
```bash
npm run build:all
```

Este comando ejecuta:
1. `build:backoffice` - Construye el panel admin
2. `build:widget` - Construye el widget embebible
3. `copy:dist` - Consolida ambos builds en `/dist/`

### Estructura del Build

```
dist/
├── index.html           # Backoffice (raíz del sitio)
├── assets/              # Assets del backoffice
└── widget/              # Widget embebible
    ├── index.html       # Demo del widget
    └── koru-booking-widget.*
```

### Deploy a GitHub Pages

```bash
npm run deploy
```

Este comando:
1. Ejecuta `build:all`
2. Despliega la carpeta `/dist/` a la rama `gh-pages`

### URLs de Producción

- **Backend API**: https://koru-booking-backend.vercel.app/api
- **Backoffice**: https://koru-booking-backoffice.pages.dev
- **Widget Demo**: https://koru-booking-widget.pages.dev

## 🧪 Testing QA

- [ ] **Test de Conflicto**: Dos usuarios intentan reservar el mismo slot
- [ ] **Test de Buffer**: Buffer bloquea correctamente el siguiente slot
- [ ] **Test de Timezone**: Horarios mostrados correctamente
- [ ] **Email Trigger**: Confirmación enviada en < 1 minuto
- [ ] **Slots Pasados**: No mostrar horarios que ya pasaron

## 🔐 Seguridad

- ✅ Validación de datos con Zod
- ✅ Transacciones atómicas para prevenir race conditions
- ✅ Unique constraints en base de datos
- ✅ CORS configurado
- ✅ Autenticación Koru en backoffice

## 📚 Documentación

Cada subdirectorio tiene su propio README con instrucciones específicas:
- [Widget README](./widget/README.md)
- [Backend README](./backend/README.md)
- [Backoffice README](./backoffice/README.md)

## 🔗 Enlaces

- [Koru Platform](https://www.korusuite.com)
- [Koru React SDK](https://www.npmjs.com/package/@redclover/koru-react-sdk)
- [Koru Widget SDK](https://www.npmjs.com/package/@redclover/koru-sdk)

## 🤝 Contribución

Este proyecto fue generado por **Koru Orchestrator**, el sistema de scaffolding inteligente del ecosistema Koru.

## 📄 Licencia

MIT © Red Clover
