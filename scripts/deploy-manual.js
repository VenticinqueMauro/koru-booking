const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { rimrafSync } = require('rimraf');

const distPath = path.join(__dirname, '..', 'dist');
const deployPath = path.join(__dirname, '..', '.deploy');

console.log('🚀 Manual deployment to gh-pages');
console.log('================================\n');

// Helper function to copy directory (excluding .git)
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        // Skip .git directory
        if (entry.name === '.git') continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    // Step 1: Clean deploy directory
    console.log('🧹 Cleaning deploy directory...');
    if (fs.existsSync(deployPath)) {
        rimrafSync(deployPath, { maxRetries: 5, retryDelay: 200 });
    }

    // Step 2: Copy dist to deploy (without .git)
    console.log('📦 Copying files to deploy directory...');
    copyDir(distPath, deployPath);

    // Save current directory
    const originalCwd = process.cwd();

    // Change to deploy directory for all git operations
    process.chdir(deployPath);

    // Step 3: Initialize new git repo in deploy
    console.log('📁 Initializing git...');
    execSync('git init', { stdio: 'inherit' });

    // Step 4: Configure git user
    console.log('👤 Configuring git user...');
    execSync('git config user.name "Venticinque Mauro"', { stdio: 'pipe' });
    execSync('git config user.email "102001296+VenticinqueMauro@users.noreply.github.com"', { stdio: 'pipe' });

    // Step 5: Add all files
    console.log('📝 Adding files...');
    execSync('git add -A', { stdio: 'inherit' });

    // Step 6: Commit
    console.log('💾 Creating commit...');
    execSync('git commit -m "Deploy to gh-pages"', { stdio: 'inherit' });

    // Step 7: Add remote
    console.log('🔗 Adding remote...');
    execSync('git remote add origin https://github.com/VenticinqueMauro/koru-booking.git', { stdio: 'pipe' });

    // Step 8: Force push to gh-pages branch
    console.log('🚢 Pushing to gh-pages...');
    execSync('git push origin master:gh-pages --force', { stdio: 'inherit' });

    // Restore original directory
    process.chdir(originalCwd);

    console.log('\n✅ Deployment successful!');
    console.log('🌐 Your site will be available at: https://venticinquemauro.github.io/koru-booking/');

} catch (error) {
    // Restore directory if we changed it
    try {
        const rootPath = path.join(__dirname, '..');
        if (process.cwd() !== rootPath) {
            process.chdir(rootPath);
        }
    } catch (e) {
        // Ignore
    }
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
} finally {
    // Make sure we're back in root
    try {
        const rootPath = path.join(__dirname, '..');
        if (process.cwd() !== rootPath) {
            process.chdir(rootPath);
        }
    } catch (e) {
        // Ignore
    }

    // Clean up deploy directory
    console.log('\n🧹 Cleaning up...');
    if (fs.existsSync(deployPath)) {
        try {
            rimrafSync(deployPath, { maxRetries: 5, retryDelay: 200 });
            console.log('✅ Cleanup complete');
        } catch (e) {
            console.log('⚠️  Could not clean .deploy directory, please delete manually');
        }
    }
}
