#!/usr/bin/env node

/**
 * Script de setup inicial para Vercel
 * 
 * Este script te guía paso a paso en la configuración inicial
 * de los proyectos en Vercel.
 * 
 * Uso:
 *   node scripts/vercel-setup.js
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command, cwd) {
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        return true;
    } catch (error) {
        return false;
    }
}

async function checkVercelCLI() {
    log('\n📦 Verificando Vercel CLI...', 'cyan');

    try {
        execSync('vercel --version', { stdio: 'pipe' });
        log('✓ Vercel CLI instalado', 'green');
        return true;
    } catch (error) {
        log('✗ Vercel CLI no encontrado', 'red');

        const install = await question('\n¿Deseas instalar Vercel CLI ahora? (s/n): ');

        if (install.toLowerCase() === 's' || install.toLowerCase() === 'y') {
            log('\nInstalando Vercel CLI...', 'cyan');
            const success = execCommand('npm install -g vercel', process.cwd());

            if (success) {
                log('✓ Vercel CLI instalado exitosamente', 'green');
                return true;
            } else {
                log('✗ Error al instalar Vercel CLI', 'red');
                return false;
            }
        }

        return false;
    }
}

async function checkVercelAuth() {
    log('\n🔐 Verificando autenticación en Vercel...', 'cyan');

    try {
        const output = execSync('vercel whoami', { stdio: 'pipe' }).toString();
        log(`✓ Autenticado como: ${output.trim()}`, 'green');
        return true;
    } catch (error) {
        log('✗ No estás autenticado en Vercel', 'red');

        const login = await question('\n¿Deseas hacer login ahora? (s/n): ');

        if (login.toLowerCase() === 's' || login.toLowerCase() === 'y') {
            log('\nAbriendo navegador para login...', 'cyan');
            const success = execCommand('vercel login', process.cwd());

            if (success) {
                log('✓ Login exitoso', 'green');
                return true;
            } else {
                log('✗ Error en login', 'red');
                return false;
            }
        }

        return false;
    }
}

async function linkProject(name, directory) {
    log(`\n🔗 Configurando ${name}...`, 'cyan');

    const projectPath = path.join(__dirname, '..', directory);

    log(`\nAhora se abrirá el proceso de link para ${name}.`, 'yellow');
    log('Responde las siguientes preguntas:', 'yellow');
    log('  - Set up and deploy? → Yes', 'yellow');
    log('  - Which scope? → Red Clover team', 'yellow');
    log('  - Link to existing project? → Si ya existe, Yes. Si no, No (crear nuevo)', 'yellow');
    log(`  - Project name? → koru-booking-${directory}`, 'yellow');
    log('  - In which directory is your code located? → . (punto)', 'yellow');

    await question('\nPresiona Enter para continuar...');

    const success = execCommand('vercel link', projectPath);

    if (success) {
        log(`✓ ${name} linked exitosamente`, 'green');
        return true;
    } else {
        log(`✗ Error al linkear ${name}`, 'red');
        return false;
    }
}

async function showEnvVarsInstructions(component) {
    log(`\n📝 Configuración de Variables de Entorno para ${component}`, 'bright');
    log('═══════════════════════════════════════════════════════════', 'bright');

    log('\n1. Abre tu navegador y ve a:', 'cyan');
    log(`   https://vercel.com/dashboard`, 'yellow');

    log('\n2. Selecciona el proyecto:', 'cyan');
    log(`   koru-booking-${component.toLowerCase()}`, 'yellow');

    log('\n3. Ve a: Settings → Environment Variables', 'cyan');

    log('\n4. Agrega las siguientes variables para Production:', 'cyan');

    if (component === 'Backend') {
        log(`
NODE_ENV=production
DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres.ptxtuoqvjgpwknjmqido:5kF6Eeogx3k6W1S1@db.ptxtuoqvjgpwknjmqido.supabase.co:5432/postgres
SUPABASE_URL=https://ptxtuoqvjgpwknjmqido.supabase.co
SUPABASE_ANON_KEY=[OBTENER DE SUPABASE]
RESEND_API_KEY=re_HJv79qeu_Lq3eLZZZYMFsL3s1LTJJbeGa
EMAIL_FROM=booking@korusuite.com
KORU_API_URL=https://www.korusuite.com
KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
KORU_APP_SECRET=fea88b8d53d3be7b3672e1c41059d9f10f8b18e8fa4fbdfa2bec7805db68bf52
CORS_ORIGIN=https://koru-booking-widget.vercel.app,https://koru-booking-backoffice.vercel.app
    `, 'yellow');
    } else if (component === 'Backoffice') {
        log(`
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
    `, 'yellow');
    } else if (component === 'Widget') {
        log(`
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app
VITE_KORU_WEBSITE_ID=[tu-website-id]
VITE_KORU_APP_ID=034927e7-ebe2-4c6b-9c9d-9b56c453d807
VITE_KORU_URL=https://www.korusuite.com
    `, 'yellow');
    }

    log('\n5. Marca como "Sensitive" las variables que contienen secretos', 'cyan');

    await question('\nPresiona Enter cuando hayas terminado de configurar las variables...');
}

async function main() {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
    log('║     KORU BOOKING - VERCEL SETUP WIZARD                   ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════╝', 'bright');

    log('\nEste script te ayudará a configurar los proyectos en Vercel.', 'cyan');
    log('Solo necesitas ejecutarlo una vez.\n', 'cyan');

    // Paso 1: Verificar Vercel CLI
    const hasCLI = await checkVercelCLI();
    if (!hasCLI) {
        log('\n❌ No se puede continuar sin Vercel CLI', 'red');
        rl.close();
        process.exit(1);
    }

    // Paso 2: Verificar autenticación
    const isAuth = await checkVercelAuth();
    if (!isAuth) {
        log('\n❌ No se puede continuar sin autenticación', 'red');
        rl.close();
        process.exit(1);
    }

    // Paso 3: Link proyectos
    log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
    log('║     PASO 1: LINKING PROYECTOS                            ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════╝', 'bright');

    const linkBackend = await question('\n¿Deseas linkear el Backend? (s/n): ');
    if (linkBackend.toLowerCase() === 's' || linkBackend.toLowerCase() === 'y') {
        await linkProject('Backend', 'backend');
    }

    const linkBackoffice = await question('\n¿Deseas linkear el Backoffice? (s/n): ');
    if (linkBackoffice.toLowerCase() === 's' || linkBackoffice.toLowerCase() === 'y') {
        await linkProject('Backoffice', 'backoffice');
    }

    const linkWidget = await question('\n¿Deseas linkear el Widget? (s/n): ');
    if (linkWidget.toLowerCase() === 's' || linkWidget.toLowerCase() === 'y') {
        await linkProject('Widget', 'widget');
    }

    // Paso 4: Instrucciones de variables de entorno
    log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
    log('║     PASO 2: CONFIGURAR VARIABLES DE ENTORNO              ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════╝', 'bright');

    if (linkBackend.toLowerCase() === 's' || linkBackend.toLowerCase() === 'y') {
        await showEnvVarsInstructions('Backend');
    }

    if (linkBackoffice.toLowerCase() === 's' || linkBackoffice.toLowerCase() === 'y') {
        await showEnvVarsInstructions('Backoffice');
    }

    if (linkWidget.toLowerCase() === 's' || linkWidget.toLowerCase() === 'y') {
        await showEnvVarsInstructions('Widget');
    }

    // Resumen final
    log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
    log('║     ✅ SETUP COMPLETADO                                   ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════╝', 'bright');

    log('\n🎉 ¡Setup inicial completado!', 'green');
    log('\nPróximos pasos:', 'cyan');
    log('  1. Verifica que las variables de entorno estén configuradas en Vercel Dashboard', 'yellow');
    log('  2. Actualiza los archivos .env.production en backoffice y widget', 'yellow');
    log('  3. Ejecuta tu primer deployment:', 'yellow');
    log('     npm run vercel:deploy', 'bright');

    log('\nPara más información, consulta:', 'cyan');
    log('  - DEPLOYMENT_GUIDE.md', 'yellow');
    log('  - backend/VERCEL_SETUP.md', 'yellow');
    log('  - FRONTEND_VERCEL_SETUP.md', 'yellow');

    rl.close();
}

main();
