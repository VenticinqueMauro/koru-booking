-- =====================================================
-- PASO 1: Copiar este archivo completo
-- PASO 2: Ir a https://supabase.com/dashboard/project/hrousezcjlqxtkumspri/sql/new
-- PASO 3: Pegar todo este contenido y hacer clic en "Run"
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (para empezar limpio)
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "WidgetSettings" CASCADE;
DROP TABLE IF EXISTS "Schedule" CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;

-- Table: Service
CREATE TABLE "Service" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL,
    "buffer" INTEGER DEFAULT 0,
    "imageUrl" TEXT,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Service_active_idx" ON "Service"("active");

-- Table: Schedule
CREATE TABLE "Schedule" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_dayOfWeek_key" UNIQUE("dayOfWeek")
);

CREATE INDEX "Schedule_enabled_idx" ON "Schedule"("enabled");

-- Table: Booking
CREATE TABLE "Booking" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "serviceId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId")
        REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_date_time_key" UNIQUE("serviceId", "date", "time")
);

CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- Table: WidgetSettings
CREATE TABLE "WidgetSettings" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "layout" TEXT DEFAULT 'list',
    "stepInterval" INTEGER DEFAULT 30,
    "accentColor" TEXT DEFAULT '#00C896',
    "notifyEmail" TEXT NOT NULL,
    "timezone" TEXT DEFAULT 'America/Mexico_City',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Function to auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updatedAt
CREATE TRIGGER update_service_updated_at
    BEFORE UPDATE ON "Service"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_updated_at
    BEFORE UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_updated_at
    BEFORE UPDATE ON "Booking"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widgetsettings_updated_at
    BEFORE UPDATE ON "WidgetSettings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - Datos iniciales para pruebas
-- =====================================================

-- Insert default schedule (Lunes a Viernes 9:00-18:00, con break 13:00-14:00)
INSERT INTO "Schedule" ("id", "dayOfWeek", "enabled", "startTime", "endTime", "breakStart", "breakEnd")
VALUES
    (uuid_generate_v4()::TEXT, 0, false, '09:00', '18:00', NULL, NULL),           -- Domingo
    (uuid_generate_v4()::TEXT, 1, true, '09:00', '18:00', '13:00', '14:00'),      -- Lunes
    (uuid_generate_v4()::TEXT, 2, true, '09:00', '18:00', '13:00', '14:00'),      -- Martes
    (uuid_generate_v4()::TEXT, 3, true, '09:00', '18:00', '13:00', '14:00'),      -- Miércoles
    (uuid_generate_v4()::TEXT, 4, true, '09:00', '18:00', '13:00', '14:00'),      -- Jueves
    (uuid_generate_v4()::TEXT, 5, true, '09:00', '18:00', '13:00', '14:00'),      -- Viernes
    (uuid_generate_v4()::TEXT, 6, false, '09:00', '18:00', NULL, NULL);           -- Sábado

-- Insert sample services
INSERT INTO "Service" ("id", "name", "duration", "price", "buffer", "imageUrl", "active")
VALUES
    (uuid_generate_v4()::TEXT, 'Corte de Cabello', 30, 250.00, 10, NULL, true),
    (uuid_generate_v4()::TEXT, 'Masaje Relajante', 60, 450.00, 15, NULL, true),
    (uuid_generate_v4()::TEXT, 'Consulta Médica', 45, 500.00, 5, NULL, true),
    (uuid_generate_v4()::TEXT, 'Terapia Física', 50, 400.00, 10, NULL, true);

-- Insert default widget settings
INSERT INTO "WidgetSettings" ("id", "layout", "stepInterval", "accentColor", "notifyEmail", "timezone")
VALUES
    (uuid_generate_v4()::TEXT, 'list', 30, '#00C896', 'admin@koru-booking.com', 'America/Mexico_City');

-- =====================================================
-- VERIFICATION - Verifica que todo se creó correctamente
-- =====================================================

SELECT 'Database setup completed successfully!' as status;
SELECT 'Services: ' || COUNT(*)::TEXT as count FROM "Service";
SELECT 'Schedules: ' || COUNT(*)::TEXT as count FROM "Schedule";
SELECT 'Widget Settings: ' || COUNT(*)::TEXT as count FROM "WidgetSettings";
SELECT 'Bookings: ' || COUNT(*)::TEXT as count FROM "Booking";
