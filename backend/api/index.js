// Vercel serverless function wrapper
// This file exports the Express app for Vercel's serverless platform

// Import from the compiled dist folder (TypeScript is compiled during vercel-build)
import app from '../dist/index.js';

// Export the Express app as the default export for Vercel
export default app;
