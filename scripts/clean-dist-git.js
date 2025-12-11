const fs = require('fs');
const path = require('path');

// Función para eliminar directorio recursivamente
function removeDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

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

    // Eliminar el directorio principal
    try {
        fs.rmdirSync(dir);
    } catch (e) {
        // Ignorar errores
    }
}

const distGitPath = path.join(__dirname, '..', 'dist', '.git');

if (fs.existsSync(distGitPath)) {
    console.log('🧹 Removing .git from dist directory...');
    removeDir(distGitPath);
    console.log('✅ .git removed from dist');
} else {
    console.log('✅ No .git found in dist (already clean)');
}
