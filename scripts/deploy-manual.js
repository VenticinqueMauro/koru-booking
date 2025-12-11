const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { rimrafSync } = require('rimraf');

const distPath = path.join(__dirname, '..', 'dist');
const distGitPath = path.join(distPath, '.git');

console.log('🚀 Manual deployment to gh-pages');
console.log('================================\n');

// Step 1: Clean any existing .git in dist
if (fs.existsSync(distGitPath)) {
    console.log('🧹 Cleaning existing .git in dist...');
    try {
        rimrafSync(distGitPath, { maxRetries: 3, retryDelay: 100 });
        console.log('✅ Cleaned\n');
    } catch (error) {
        console.log('⚠️  Could not clean .git, continuing anyway...\n');
    }
}

try {
    // Step 2: Initialize new git repo in dist
    console.log('📁 Initializing git in dist...');
    execSync('git init', { cwd: distPath, stdio: 'inherit' });

    // Step 3: Configure git user
    console.log('👤 Configuring git user...');
    execSync('git config user.name "Venticinque Mauro"', { cwd: distPath });
    execSync('git config user.email "102001296+VenticinqueMauro@users.noreply.github.com"', { cwd: distPath });

    // Step 4: Add all files
    console.log('📦 Adding files...');
    execSync('git add -A', { cwd: distPath, stdio: 'inherit' });

    // Step 5: Commit
    console.log('💾 Creating commit...');
    execSync('git commit -m "Deploy to gh-pages"', { cwd: distPath, stdio: 'inherit' });

    // Step 6: Add remote
    console.log('🔗 Adding remote...');
    execSync('git remote add origin https://github.com/VenticinqueMauro/koru-booking.git', { cwd: distPath });

    // Step 7: Force push to gh-pages branch
    console.log('🚢 Pushing to gh-pages...');
    execSync('git push origin master:gh-pages --force', { cwd: distPath, stdio: 'inherit' });

    console.log('\n✅ Deployment successful!');
    console.log('🌐 Your site will be available at: https://venticinquemauro.github.io/koru-booking/');

} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
} finally {
    // Clean up .git after deployment
    if (fs.existsSync(distGitPath)) {
        console.log('\n🧹 Cleaning up...');
        try {
            rimrafSync(distGitPath, { maxRetries: 3 });
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}
