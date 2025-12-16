const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Deploying to Netlify');
console.log('========================\n');

// Helper to run command with output
function run(command, description) {
    console.log(`📦 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} complete\n`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        process.exit(1);
    }
}

try {
    // Check if netlify CLI is installed
    try {
        execSync('netlify --version', { stdio: 'pipe' });
    } catch {
        console.error('❌ Netlify CLI not found. Please install it:');
        console.error('   npm install -g netlify-cli');
        console.error('   netlify login');
        process.exit(1);
    }

    // Site IDs from Netlify
    const BACKOFFICE_SITE_ID = '989ed12a-f968-4f13-93bd-64c2bdad412d';
    const WIDGET_SITE_ID = 'edd136c6-1000-4c64-a6fe-848d09335fe6';

    // Deploy backoffice
    console.log('🏢 Deploying Backoffice...');
    console.log('─'.repeat(50));
    run(
        `netlify deploy --dir=backoffice/dist --prod --site=${BACKOFFICE_SITE_ID}`,
        'Backoffice deployment'
    );

    // Deploy widget
    console.log('🎨 Deploying Widget...');
    console.log('─'.repeat(50));
    run(
        `netlify deploy --dir=widget/dist --prod --site=${WIDGET_SITE_ID}`,
        'Widget deployment'
    );

    console.log('🎉 All deployments successful!\n');
    console.log('📱 Your sites are live:');
    console.log('   Backoffice: https://koru-booking-backoffice.netlify.app');
    console.log('   Widget: https://koru-booking-widget.netlify.app');

} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
}
