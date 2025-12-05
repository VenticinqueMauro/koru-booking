export { BookingWidget } from './widget';
export type { Service, BookingRequest, BookingResponse } from './api/client';

// Auto-start cuando se carga como script
if (typeof window !== 'undefined' && document.currentScript) {
  const { BookingWidget } = await import('./widget');
  new BookingWidget().start();
}
