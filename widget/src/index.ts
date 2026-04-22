import { BookingWidget } from './widget';
export { BookingWidget };
export type { Service, BookingRequest, BookingResponse } from './api/client';
export type { OpenFromTriggersOpts } from './widget';

// Auto-start cuando se carga como script
if (typeof window !== 'undefined') {
  // document.currentScript solo está disponible durante la evaluación síncrona del script
  const currentScript = document.currentScript as HTMLScriptElement | null;
  const headless = currentScript?.dataset?.headless === 'true';
  if (headless) console.log('[koru-booking] modo headless — botón flotante desactivado');

  const widget = new BookingWidget(headless);
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
