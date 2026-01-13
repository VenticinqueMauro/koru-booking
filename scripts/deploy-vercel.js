#!/usr/bin/env node

/**
 * Script de deployment automatizado para Vercel
 * 
 * Este script automatiza el proceso de deployment a Vercel sin necesidad
 * de conectar GitHub (útil cuando el repo es privado sin plan de pago).
 * 
 * Uso:
 *   node scripts/deploy-vercel.js [backend|backoffice|widget|all]
 * 
 * Ejemplos:
 *   node scripts/deploy-vercel.js all           # Deploy todo
 *   node scripts/deploy-vercel.js backend       # Solo backend
 *   node scripts/deploy-vercel.js backoffice    # Solo backoffice
 *   node scripts/deploy-vercel.js widget        # Solo widget
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
    log('  - DIRECT_DATABASE_URL (direct connection for migrations)\n', 'yellow');

    // Deploy a producción
    return execCommand(
        'vercel --prod --yes',
        backendDir,
        'Deploying backend a producción'
    );
}

function deployBackoffice() {
    log('\n═══════════════════════════════════════', 'bright');
    log('  DEPLOYING BACKOFFICE TO VERCEL', 'bright');
    log('═══════════════════════════════════════', 'bright');

    const backofficeDir = path.join(__dirname, '..', 'backoffice');

    if (!fs.existsSync(backofficeDir)) {
        log('Error: Directorio backoffice no encontrado', 'red');
        return false;
    }

    // Instalar dependencias
    if (!execCommand(
        'npm install',
        backofficeDir,
        'Instalando dependencias'
    )) {
        return false;
    }

    // Build
    if (!execCommand(
        'npm run build',
        backofficeDir,
        'Building backoffice'
    )) {
        return false;
    }

    // Deploy a producción
    return execCommand(
        'vercel --prod --yes',
        backofficeDir,
        'Deploying backoffice a producción'
    );
}

function deployWidget() {
    log('\n═══════════════════════════════════════', 'bright');
    log('  DEPLOYING WIDGET TO VERCEL', 'bright');
    log('═══════════════════════════════════════', 'bright');

    const widgetDir = path.join(__dirname, '..', 'widget');

    if (!fs.existsSync(widgetDir)) {
        log('Error: Directorio widget no encontrado', 'red');
        return false;
    }

    // Instalar dependencias
    if (!execCommand(
        'npm install',
        widgetDir,
        'Instalando dependencias'
    )) {
        return false;
    }

    // Build
    if (!execCommand(
        'npm run build',
        widgetDir,
        'Building widget'
    )) {
        return false;
    }

    // Deploy a producción
    return execCommand(
        'vercel --prod --yes',
        widgetDir,
        'Deploying widget a producción'
    );
}

function deployAll() {
    log('\n╔═══════════════════════════════════════╗', 'bright');
    log('║  DEPLOYING ALL COMPONENTS TO VERCEL  ║', 'bright');
    log('╚═══════════════════════════════════════╝', 'bright');

    const results = {
        backend: false,
        backoffice: false,
        widget: false
    };

    // Deploy backend primero (los frontends dependen de él)
    results.backend = deployBackend();

    if (!results.backend) {
        log('\n⚠ Backend deployment falló. ¿Continuar con frontend? (Ctrl+C para cancelar)', 'yellow');
        // Esperar 5 segundos antes de continuar
        execSync('timeout /t 5', { stdio: 'inherit', shell: true });
    }

    // Deploy frontends en paralelo (conceptualmente, aunque se ejecutan secuencialmente)
    results.backoffice = deployBackoffice();
    results.widget = deployWidget();

    // Resumen final
    log('\n╔═══════════════════════════════════════╗', 'bright');
    log('║         DEPLOYMENT SUMMARY            ║', 'bright');
    log('╚═══════════════════════════════════════╝', 'bright');

    log(`\nBackend:    ${results.backend ? '✓ SUCCESS' : '✗ FAILED'}`, results.backend ? 'green' : 'red');
    log(`Backoffice: ${results.backoffice ? '✓ SUCCESS' : '✗ FAILED'}`, results.backoffice ? 'green' : 'red');
    log(`Widget:     ${results.widget ? '✓ SUCCESS' : '✗ FAILED'}`, results.widget ? 'green' : 'red');

    const allSuccess = results.backend && results.backoffice && results.widget;

    if (allSuccess) {
        log('\n🎉 ¡Todos los componentes deployados exitosamente!', 'green');
    } else {
        log('\n⚠ Algunos componentes fallaron. Revisa los logs arriba.', 'yellow');
    }

    return allSuccess;
}

// Main
function main() {
    const args = process.argv.slice(2);
    const target = args[0] || 'all';

    log('\n🚀 Koru Booking - Vercel Deployment Script', 'bright');
    log('═══════════════════════════════════════════\n', 'bright');

    let success = false;

    switch (target.toLowerCase()) {
        case 'backend':
            success = deployBackend();
            break;
        case 'backoffice':
            success = deployBackoffice();
            break;
        case 'widget':
            success = deployWidget();
            break;
        case 'all':
            success = deployAll();
            break;
        default:
            log(`Error: Target desconocido "${target}"`, 'red');
            log('\nUso: node scripts/deploy-vercel.js [backend|backoffice|widget|all]', 'yellow');
            process.exit(1);
    }

    process.exit(success ? 0 : 1);
}

main();
