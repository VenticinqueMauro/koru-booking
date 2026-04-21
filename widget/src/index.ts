import { BookingWidget } from './widget';
export { BookingWidget };
export type { Service, BookingRequest, BookingResponse } from './api/client';
export type { OpenFromTriggersOpts } from './widget';

// Auto-start cuando se carga como script
if (typeof window !== 'undefined') {
  const widget = new BookingWidget();
  widget.start()
    .then(() => {
      // Exponer API pública para koru-triggers
      (window as any).KoruBooking = {
        open: (opts: any) => widget.openFromTriggers(opts),
      };
      console.log('[koru-booking] window.KoruBooking ready');
    })
    .catch(console.error);
}
