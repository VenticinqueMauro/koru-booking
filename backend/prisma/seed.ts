import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('');

  // Clear existing data (optional, comentar si no quieres limpiar)
  console.log('🗑️  Clearing existing data...');
  await prisma.booking.deleteMany();
  await prisma.widgetSettings.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.service.deleteMany();
  console.log('');

  // Seed Services
  console.log('📋 Creating services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte de Cabello',
        duration: 30,
        price: 250,
        buffer: 10,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Masaje Relajante',
        duration: 60,
        price: 450,
        buffer: 15,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Consulta Médica',
        duration: 45,
        price: 500,
        buffer: 5,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Terapia Física',
        duration: 50,
        price: 400,
        buffer: 10,
        active: true,
      },
    }),
  ]);
  console.log(`✓ Created ${services.length} services`);
  console.log('');

  // Seed Schedule (Lunes a Viernes 9:00-18:00, con break 13:00-14:00)
  console.log('📅 Creating schedules...');
  const schedules = await Promise.all([
    // Domingo (0) - Cerrado
    prisma.schedule.create({
      data: {
        dayOfWeek: 0,
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    // Lunes (1) - Abierto
    prisma.schedule.create({
      data: {
        dayOfWeek: 1,
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    }),
    // Martes (2) - Abierto
    prisma.schedule.create({
      data: {
        dayOfWeek: 2,
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    }),
    // Miércoles (3) - Abierto
    prisma.schedule.create({
      data: {
        dayOfWeek: 3,
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    }),
    // Jueves (4) - Abierto
    prisma.schedule.create({
      data: {
        dayOfWeek: 4,
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    }),
    // Viernes (5) - Abierto
    prisma.schedule.create({
      data: {
        dayOfWeek: 5,
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    }),
    // Sábado (6) - Cerrado
    prisma.schedule.create({
      data: {
        dayOfWeek: 6,
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
  ]);
  console.log(`✓ Created ${schedules.length} schedules`);
  console.log('');

  // Seed Widget Settings
  console.log('⚙️  Creating widget settings...');
  const settings = await prisma.widgetSettings.create({
    data: {
      layout: 'list',
      stepInterval: 30,
      accentColor: '#00C896',
      notifyEmail: 'admin@tu-dominio.com',
      timezone: 'America/Mexico_City',
    },
  });
  console.log('✓ Created widget settings');
  console.log('');

  // Optional: Seed sample bookings (comentar si no quieres datos de prueba)
  console.log('📝 Creating sample bookings...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await Promise.all([
    prisma.booking.create({
      data: {
        serviceId: services[0].id,
        customerName: 'Juan Pérez',
        customerEmail: 'juan.perez@example.com',
        customerPhone: '+52 55 1234 5678',
        date: tomorrow,
        time: '10:00',
        notes: 'Primera cita',
        status: 'confirmed',
      },
    }),
    prisma.booking.create({
      data: {
        serviceId: services[1].id,
        customerName: 'María García',
        customerEmail: 'maria.garcia@example.com',
        customerPhone: '+52 55 8765 4321',
        date: tomorrow,
        time: '11:00',
        notes: 'Prefiere masaje suave',
        status: 'confirmed',
      },
    }),
  ]);
  console.log('✓ Created sample bookings');
  console.log('');

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  • Services: ${services.length}`);
  console.log(`  • Schedules: ${schedules.length}`);
  console.log(`  • Widget Settings: 1`);
  console.log(`  • Sample Bookings: 2`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
