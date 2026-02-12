#!/usr/bin/env node

/**
 * Script de deployment automatizado para Vercel (Backend)
 *
 * Este script automatiza el deployment del backend a Vercel.
 * Los frontends (backoffice y widget) se deplayan a Cloudflare Pages.
 *
 * Uso:
 *   node scripts/deploy-vercel.js
 *
 * Nota: Las migraciones de Prisma se ejecutan automáticamente en Vercel
 *       durante el build gracias a "vercel-build": "prisma generate && tsc"
 *       y "postdeploy": "prisma migrate deploy" en backend/package.json
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd, description) {
    log(`\n▶ ${description}...`, 'cyan');
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        log(`✓ ${description} completado`, 'green');
        return true;
    } catch (error) {
        log(`✗ Error en ${description}`, 'red');
        console.error(error.message);
        return false;
    }
}

function deployBackend() {
    log('\n═══════════════════════════════════════', 'bright');
    log('  DEPLOYING BACKEND TO VERCEL', 'bright');
    log('═══════════════════════════════════════', 'bright');

    const backendDir = path.join(__dirname, '..', 'backend');

    // Verificar que el directorio existe
    if (!fs.existsSync(backendDir)) {
        log('Error: Directorio backend no encontrado', 'red');
        return false;
    }

    // Las migraciones se ejecutarán automáticamente en Vercel durante el build
    log('\n⚠ Nota: Las migraciones se ejecutarán automáticamente en Vercel', 'yellow');
    log('Asegúrate de tener las variables de entorno configuradas en Vercel:', 'yellow');
    log('  - DATABASE_URL (pooler connection)', 'yellow');
    log('  - DIRECT_DATABASE_URL (direct connection for migrations)', 'yellow');
    log('  - RESEND_API_KEY', 'yellow');
    log('  - EMAIL_FROM', 'yellow');
    log('  - KORU_API_URL', 'yellow');
    log('  - KORU_APP_ID', 'yellow');
    log('  - KORU_APP_SECRET', 'yellow');
    log('  - CORS_ORIGIN\n', 'yellow');

    // Deploy a producción
    const success = execCommand(
        'vercel --prod --yes',
        backendDir,
        'Deploying backend a producción'
    );

    if (success) {
        log('\n🎉 Backend deployado exitosamente!', 'green');
        log('\n💡 Recuerda:', 'cyan');
        log('  - Frontend (backoffice y widget) se deploya a Cloudflare Pages', 'cyan');
        log('  - Usa: npm run deploy (desde root) para deployar frontends', 'cyan');
    } else {
        log('\n⚠ Backend deployment falló. Revisa los logs arriba.', 'yellow');
    }

    return success;
}

// Main
function main() {
    log('\n🚀 Koru Booking - Vercel Backend Deployment', 'bright');
    log('═══════════════════════════════════════════\n', 'bright');

    const success = deployBackend();
    process.exit(success ? 0 : 1);
}

main();
