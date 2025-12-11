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

    // Step 3: Initialize new git repo in deploy
    console.log('📁 Initializing git...');
    execSync('git init', { cwd: deployPath, stdio: 'inherit' });

    // Step 4: Configure git user
    console.log('👤 Configuring git user...');
    execSync('git config user.name "Venticinque Mauro"', { cwd: deployPath });
    execSync('git config user.email "102001296+VenticinqueMauro@users.noreply.github.com"', { cwd: deployPath });

    // Step 5: Add all files
    console.log('📝 Adding files...');
    execSync('git add -A', { cwd: deployPath, stdio: 'inherit' });

    // Step 6: Commit
    console.log('💾 Creating commit...');
    execSync('git commit -m "Deploy to gh-pages"', { cwd: deployPath, stdio: 'inherit' });

    // Step 7: Add remote
    console.log('🔗 Adding remote...');
    execSync('git remote add origin https://github.com/VenticinqueMauro/koru-booking.git', { cwd: deployPath });

    // Step 8: Force push to gh-pages branch
    console.log('🚢 Pushing to gh-pages...');
    execSync('git push origin master:gh-pages --force', { cwd: deployPath, stdio: 'inherit' });

    console.log('\n✅ Deployment successful!');
    console.log('🌐 Your site will be available at: https://venticinquemauro.github.io/koru-booking/');

} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
} finally {
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
