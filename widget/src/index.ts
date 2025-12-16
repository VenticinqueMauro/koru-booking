import { BookingWidget } from './widget';
export { BookingWidget };
export type { Service, BookingRequest, BookingResponse } from './api/client';

// Auto-start cuando se carga como script
if (typeof window !== 'undefined') {
  const widget = new BookingWidget();
  widget.start();
}
