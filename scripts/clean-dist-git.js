const { rimrafSync } = require('rimraf');
const fs = require('fs');
const path = require('path');

const distGitPath = path.join(__dirname, '..', 'dist', '.git');

if (fs.existsSync(distGitPath)) {
    console.log('🧹 Removing .git from dist directory...');
    try {
        rimrafSync(distGitPath, { maxRetries: 3 });
        console.log('✅ .git removed from dist');
    } catch (error) {
        console.error('❌ Failed to remove .git:', error.message);
        console.log('⚠️  Trying to continue anyway...');
    }
} else {
    console.log('✅ No .git found in dist (already clean)');
}
