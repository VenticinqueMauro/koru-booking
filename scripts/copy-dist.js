const fs = require('fs');
const path = require('path');

// Helper para copiar directorio recursivamente
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper para eliminar directorio recursivamente (evita .git)
function removeDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Saltar .git
        if (entry.name === '.git') continue;

        if (entry.isDirectory()) {
            removeDir(fullPath);
            try {
                fs.rmdirSync(fullPath);
            } catch (e) {
                // Ignorar errores
            }
        } else {
            try {
                fs.unlinkSync(fullPath);
            } catch (e) {
                // Ignorar errores
            }
        }
    }
}

console.log('🧹 Cleaning dist directory...');

// Limpiar solo widget y assets, no tocar .git
removeDir(path.join(__dirname, '..', 'dist', 'widget'));
removeDir(path.join(__dirname, '..', 'dist', 'assets'));

// Eliminar archivos HTML del root de dist
try {
    const distRoot = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distRoot)) {
        const files = fs.readdirSync(distRoot);
        files.forEach(file => {
            if (file.endsWith('.html')) {
                fs.unlinkSync(path.join(distRoot, file));
            }
        });
    }
} catch (e) {
    // Ignorar errores
}

console.log('📁 Creating dist structure...');

// Crear estructura de directorios
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Crear .nojekyll
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

const widgetDir = path.join(distDir, 'widget');
if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
}

console.log('📦 Copying backoffice build...');
copyDir(
    path.join(__dirname, '..', 'backoffice', 'dist'),
    distDir
);

console.log('📦 Copying widget build...');
copyDir(
    path.join(__dirname, '..', 'widget', 'dist'),
    widgetDir
);

console.log('📄 Copying widget demo as index.html...');
fs.copyFileSync(
    path.join(__dirname, '..', 'widget', 'demo.html'),
    path.join(widgetDir, 'index.html')
);

console.log('✅ Dist directory ready for deployment!');
