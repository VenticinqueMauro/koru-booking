# Configuración de Supabase para Producción

## Paso 1: Crear/Acceder a Proyecto Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto o accede a uno existente
3. Anota el nombre y región del proyecto

## Paso 2: Obtener Credenciales

### Database URL (Connection String)

1. En Supabase Dashboard, ve a: **Settings > Database**
2. Busca la sección **Connection string**
3. Selecciona el modo **URI** (no Transaction pooler para Prisma)
4. Copia la connection string que se ve así:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Reemplaza `[YOUR-PASSWORD]` con la contraseña que elegiste al crear el proyecto

### API Keys

1. Ve a: **Settings > API**
2. Copia las siguientes credenciales:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: La clave pública del proyecto

## Paso 3: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus credenciales reales:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:TU_PASSWORD_AQUI@db.tu-project-ref.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://tu-project-ref.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui

# Email (configurar después)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
EMAIL_FROM=noreply@tu-dominio.com

# Admin
ADMIN_EMAIL=admin@tu-dominio.com
```

## Paso 4: Ejecutar Migraciones

Una vez configurado el `.env` con credenciales válidas:

```bash
# Instalar dependencias si no están instaladas
npm install

# Generar el cliente de Prisma
npx prisma generate

# Crear y aplicar la migración inicial
npx prisma migrate dev --name init_postgresql

# Verificar que las tablas se crearon
npx prisma studio
```

## Paso 5: Verificar las Tablas Creadas

Las siguientes tablas deberían estar en tu base de datos:

- **Service**: Servicios ofrecidos
- **Schedule**: Horarios de trabajo por día de la semana
- **Booking**: Reservas de clientes
- **WidgetSettings**: Configuración del widget

## Paso 6: Poblar Datos Iniciales (Opcional)

Puedes crear un seed script para poblar datos de prueba:

```bash
npx prisma db seed
```

## Seguridad

⚠️ **IMPORTANTE**:

1. **NUNCA** commitees el archivo `.env` a Git (ya está en `.gitignore`)
2. **NUNCA** expongas credenciales en `.env.example`
3. Rota las credenciales si fueron expuestas accidentalmente
4. Usa variables de entorno en producción (Railway, Vercel, etc.)

## Troubleshooting

### Error: Can't reach database server

- Verifica que la DATABASE_URL sea correcta
- Verifica que la contraseña no tenga caracteres especiales sin escapar
- Verifica tu conexión a internet
- Verifica que el proyecto de Supabase esté activo (no pausado)

### Error: P1001 Connection timeout

- Supabase puede pausar proyectos gratuitos por inactividad
- Ve al dashboard y reactiva el proyecto
- Espera 1-2 minutos y vuelve a intentar

### Error: Authentication failed

- La contraseña en DATABASE_URL es incorrecta
- Puedes resetear la contraseña en: Settings > Database > Database Password
