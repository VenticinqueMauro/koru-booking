#!/usr/bin/env node

/**
 * Script de deployment automatizado para Cloudflare Pages
 *
 * Este script automatiza el proceso de deployment a Cloudflare Pages
 * usando Wrangler CLI.
 *
 * Prerequisitos:
 *   npm install -g wrangler
 *   wrangler login
 *
 * Uso:
 *   node scripts/deploy-cloudflare.js [backoffice|widget]
 *
 * Ejemplos:
 *   node scripts/deploy-cloudflare.js              # Deploy todo (backoffice + widget)
 *   node scripts/deploy-cloudflare.js backoffice   # Solo backoffice
 *   node scripts/deploy-cloudflare.js widget       # Solo widget
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

function checkWranglerCLI() {
    log('\n🔍 Verificando Wrangler CLI...', 'cyan');
    try {
        execSync('wrangler --version', { stdio: 'pipe' });
        log('✓ Wrangler CLI encontrado', 'green');
        return true;
    } catch {
        log('❌ Wrangler CLI no encontrado', 'red');
        log('\n📦 Por favor instala Wrangler CLI:', 'yellow');
        log('   npm install -g wrangler', 'yellow');
        log('   wrangler login\n', 'yellow');
        return false;
    }
}

function copyHeaders(componentDir, componentName) {
    const publicDir = path.join(componentDir, 'public');
    const distDir = path.join(componentDir, 'dist');

    // Asegurar que dist existe
    if (!fs.existsSync(distDir)) {
        log(`Error: Directorio dist no encontrado en ${componentName}`, 'red');
        return false;
    }

    // Copiar _headers si existe
    const headersSource = path.join(publicDir, '_headers');
    const headersDest = path.join(distDir, '_headers');
    if (fs.existsSync(headersSource)) {
        fs.copyFileSync(headersSource, headersDest);
        log(`✓ Copiado _headers para ${componentName}`, 'green');
    }

    // Copiar _redirects si existe
    const redirectsSource = path.join(publicDir, '_redirects');
    const redirectsDest = path.join(distDir, '_redirects');
    if (fs.existsSync(redirectsSource)) {
        fs.copyFileSync(redirectsSource, redirectsDest);
        log(`✓ Copiado _redirects para ${componentName}`, 'green');
    }

    return true;
}

function deployBackoffice() {
    log('\n═══════════════════════════════════════', 'bright');
    log('  DEPLOYING BACKOFFICE TO CLOUDFLARE', 'bright');
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

    // Copiar archivos de configuración
    if (!copyHeaders(backofficeDir, 'backoffice')) {
        return false;
    }

    // Deploy a Cloudflare Pages
    log('\n📤 Deploying a Cloudflare Pages...', 'yellow');
    log('Nota: Si es la primera vez, se creará el proyecto automáticamente', 'yellow');

    return execCommand(
        'wrangler pages deploy dist --project-name=koru-booking-backoffice --branch=master',
        backofficeDir,
        'Deploying backoffice a Cloudflare Pages'
    );
}

function deployWidget() {
    log('\n═══════════════════════════════════════', 'bright');
    log('  DEPLOYING WIDGET TO CLOUDFLARE', 'bright');
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

    // Build con copia del demo
    if (!execCommand(
        'npm run build',
        widgetDir,
        'Building widget'
    )) {
        return false;
    }

    // Copiar demo.html a dist/index.html
    const demoSource = path.join(widgetDir, 'demo.html');
    const demoTarget = path.join(widgetDir, 'dist', 'index.html');
    if (fs.existsSync(demoSource)) {
        fs.copyFileSync(demoSource, demoTarget);
        log('✓ Copiado demo.html a dist/index.html', 'green');
    } else {
        log('⚠ Advertencia: demo.html no encontrado', 'yellow');
    }

    // Copiar archivos de configuración
    if (!copyHeaders(widgetDir, 'widget')) {
        return false;
    }

    // Deploy a Cloudflare Pages
    log('\n📤 Deploying a Cloudflare Pages...', 'yellow');
    log('Nota: Si es la primera vez, se creará el proyecto automáticamente', 'yellow');

    return execCommand(
        'wrangler pages deploy dist --project-name=koru-booking-widget --branch=master',
        widgetDir,
        'Deploying widget a Cloudflare Pages'
    );
}

function deployAll() {
    log('\n╔═══════════════════════════════════════╗', 'bright');
    log('║  DEPLOYING ALL TO CLOUDFLARE         ║', 'bright');
    log('╚═══════════════════════════════════════╝', 'bright');

    const results = {
        backoffice: false,
        widget: false
    };

    // Deploy componentes frontend
    results.backoffice = deployBackoffice();
    results.widget = deployWidget();

    // Resumen final
    log('\n╔═══════════════════════════════════════╗', 'bright');
    log('║         DEPLOYMENT SUMMARY            ║', 'bright');
    log('╚═══════════════════════════════════════╝', 'bright');

    log(`\nBackoffice: ${results.backoffice ? '✓ SUCCESS' : '✗ FAILED'}`, results.backoffice ? 'green' : 'red');
    log(`Widget:     ${results.widget ? '✓ SUCCESS' : '✗ FAILED'}`, results.widget ? 'green' : 'red');

    const allSuccess = results.backoffice && results.widget;

    if (allSuccess) {
        log('\n🎉 ¡Todos los componentes deployados exitosamente!', 'green');
        log('\n📱 Tus sitios estarán disponibles en:', 'cyan');
        log('   Backoffice: https://koru-booking-backoffice.pages.dev', 'cyan');
        log('   Widget:     https://koru-booking-widget.pages.dev', 'cyan');
        log('\n💡 Importante:', 'yellow');
        log('   1. Configura las variables de entorno en Cloudflare dashboard', 'yellow');
        log('   2. Actualiza VITE_BACKEND_API_URL en backoffice y widget con la URL del backend', 'yellow');
        log('   3. Puedes configurar dominios personalizados en el dashboard de Cloudflare', 'yellow');
    } else {
        log('\n⚠ Algunos componentes fallaron. Revisa los logs arriba.', 'yellow');
    }

    return allSuccess;
}

// Main
function main() {
    const args = process.argv.slice(2);
    const target = args[0] || 'all';

    log('\n🚀 Koru Booking - Cloudflare Pages Deployment', 'bright');
    log('═══════════════════════════════════════════════\n', 'bright');

    // Verificar Wrangler CLI
    if (!checkWranglerCLI()) {
        process.exit(1);
    }

    let success = false;

    switch (target.toLowerCase()) {
        case 'backoffice':
            success = deployBackoffice();
            break;
        case 'widget':
            success = deployWidget();
            break;
        case 'all':
        default:
            success = deployAll();
            break;
    }

    process.exit(success ? 0 : 1);
}

main();
