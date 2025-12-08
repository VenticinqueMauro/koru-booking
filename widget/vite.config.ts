import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/koru-booking/widget/',
  build: {
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
    open: '/demo.html',
  },
});
