import { superAdminService } from '../services/superAdminService.js';
import { prisma } from '../utils/database.js';

async function createSuperAdmin() {
    try {
        console.log('🔐 Creating super admin user...');

        await superAdminService.createSuperAdmin(
            'admin@redclover.com.ar',
            'n)NR2vE%mYR;4nd1bB$BSRQ6o&}ZU)',
            'RedClover Admin'
        );

        console.log('✅ Super admin created successfully');
        console.log('📧 Email: admin@redclover.com.ar');
        console.log('🔑 Password: n)NR2vE%mYR;4nd1bB$BSRQ6o&}ZU)');
    } catch (error) {
        if (error instanceof Error && error.message === 'User already exists') {
            console.log('ℹ️  Super admin already exists');
        } else {
            console.error('❌ Error creating super admin:', error);
        }
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

createSuperAdmin();
