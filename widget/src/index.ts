import { BookingWidget } from './widget';
export { BookingWidget };
export type { Service, BookingRequest, BookingResponse } from './api/client';

console.log('📦 index.ts loaded');

// Auto-start cuando se carga como script
if (typeof window !== 'undefined') {
  console.log('🌐 Window is defined, creating BookingWidget instance...');
  // Simular configuración desde atributos del script si fuera necesario, 
  // pero el start() del widget ya maneja esto o los defaults.
  // En dev mode (module), document.currentScript es null.
  const widget = new BookingWidget();
  console.log('✅ BookingWidget instance created:', widget);
  widget.start();
}
