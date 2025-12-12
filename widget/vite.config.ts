import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/koru-booking/widget/',
  build: {
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'KoruBookingWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `koru-booking-widget.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'koru-booking-widget.css';
          return assetInfo.name || '';
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: '/index.html',
  },
});
