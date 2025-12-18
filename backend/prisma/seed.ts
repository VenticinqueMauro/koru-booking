import { PrismaClient } from '@prisma/client';
import { accountInitService } from '../src/services/accountInitService.js';

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
  await prisma.account.deleteMany();
  console.log('');

  // Create Account with proper initialization service
  console.log('🏢 Creating demo account with accountInitService...');
  const account = await accountInitService.createAndInitializeAccount(
    'demo-website-123',
    'koru-app-booking',
    {
      businessName: 'Demo Business',
      email: 'admin@demo.com',
    }
  );
  console.log('');

  // Seed Services
  console.log('📋 Creating services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        accountId: account.id,
        name: 'Corte de Cabello',
        duration: 30,
        price: 250,
        buffer: 10,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        accountId: account.id,
        name: 'Masaje Relajante',
        duration: 60,
        price: 450,
        buffer: 15,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        accountId: account.id,
        name: 'Consulta Médica',
        duration: 45,
        price: 500,
        buffer: 5,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        accountId: account.id,
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

  // NOTE: Schedule and WidgetSettings were already created by accountInitService
  console.log('ℹ️  Schedule and Widget Settings already initialized by accountInitService');
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
        accountId: account.id,
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
        accountId: account.id,
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
  console.log(`  • Account: ${account.websiteId}`);
  console.log(`  • Services: ${services.length}`);
  console.log(`  • Schedules: 7 (auto-created)`);
  console.log(`  • Widget Settings: 1 (auto-created)`);
  console.log(`  • Sample Bookings: 2`);
  console.log('');
  console.log('🔑 Important: Save these credentials for testing:');
  console.log(`   Account ID: ${account.id}`);
  console.log(`   Website ID: ${account.websiteId}`);
  console.log(`   App ID: ${account.appId}`);
  console.log(`   Timezone: America/Argentina/Buenos_Aires`);
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
