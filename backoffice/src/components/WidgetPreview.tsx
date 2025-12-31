import { useMemo } from 'react';
import { UpdateWidgetSettingsInput } from '../types';
import { Monitor, Calendar, Clock, ChevronRight } from 'lucide-react';

interface WidgetPreviewProps {
  settings: UpdateWidgetSettingsInput;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const {
    accentColor,
    displayMode,
    triggerText,
    triggerPosition,
    offsetX,
    offsetY,
    layout,
  } = settings;

  // Calculate position styles for the floating button
  const buttonPositionStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      position: 'absolute',
    };

    // Scale offsets for preview (divide by 3 for proportional preview)
    const scaledOffsetX = Math.max(8, offsetX / 3);
    const scaledOffsetY = Math.max(8, offsetY / 3);

    switch (triggerPosition) {
      case 'bottom-right':
        styles.bottom = `${scaledOffsetY}px`;
        styles.right = `${scaledOffsetX}px`;
        break;
      case 'bottom-left':
        styles.bottom = `${scaledOffsetY}px`;
        styles.left = `${scaledOffsetX}px`;
        break;
      case 'top-right':
        styles.top = `${scaledOffsetY}px`;
        styles.right = `${scaledOffsetX}px`;
        break;
      case 'top-left':
        styles.top = `${scaledOffsetY}px`;
        styles.left = `${scaledOffsetX}px`;
        break;
    }

    return styles;
  }, [triggerPosition, offsetX, offsetY]);

  // Mock services for preview
  const mockServices = [
    { name: 'Corte de cabello', duration: 30, price: 2500 },
    { name: 'Coloración', duration: 90, price: 8500 },
    { name: 'Tratamiento capilar', duration: 45, price: 4500 },
  ];

  return (
    <div className="relative">
      {/* Preview Label */}
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Vista previa en tiempo real
        </span>
      </div>

      {/* Browser Frame */}
      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Browser Header */}
        <div className="bg-muted/50 border-b border-border px-4 py-2.5 flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-background/80 rounded-md px-4 py-1 text-xs text-muted-foreground font-mono flex items-center gap-2 max-w-[200px] w-full">
              <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="truncate">tusitio.com</span>
            </div>
          </div>

          {/* Empty space for symmetry */}
          <div className="w-[52px]" />
        </div>

        {/* Website Content Mock */}
        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-[320px] overflow-hidden">
          {/* Fake website content */}
          <div className="p-6 space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Hero skeleton */}
            <div className="mt-8 space-y-3">
              <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>

            {/* Content skeleton */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* MODAL MODE: Floating Button */}
          {displayMode === 'modal' && (
            <button
              style={{
                ...buttonPositionStyles,
                backgroundColor: accentColor,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{triggerText || 'Reservar'}</span>
            </button>
          )}

          {/* INLINE MODE: Embedded Widget */}
          {displayMode === 'inline' && (
            <div className="absolute inset-4 top-auto bottom-4">
              <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300"
                style={{
                  boxShadow: `0 25px 50px -12px ${accentColor}20`,
                }}
              >
                {/* Widget Header */}
                <div
                  className="px-4 py-3 text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-sm">Reservar cita</span>
                  </div>
                </div>

                {/* Widget Content */}
                <div className="p-3 space-y-2">
                  {/* Service List/Grid/Button based on layout */}
                  {layout === 'list' && (
                    <div className="space-y-1.5">
                      {mockServices.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                              {service.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {service.duration} min
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs font-bold"
                              style={{ color: accentColor }}
                            >
                              ${service.price.toLocaleString()}
                            </span>
                            <ChevronRight
                              className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                              style={{ color: accentColor }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {layout === 'grid' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {mockServices.slice(0, 4).map((service, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
                        >
                          <div
                            className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <Calendar className="w-3 h-3" style={{ color: accentColor }} />
                          </div>
                          <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate">
                            {service.name}
                          </p>
                          <p
                            className="text-[10px] font-bold mt-0.5"
                            style={{ color: accentColor }}
                          >
                            ${service.price.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {layout === 'button' && (
                    <div className="space-y-1.5">
                      {mockServices.map((service, idx) => (
                        <button
                          key={idx}
                          className="w-full py-2 px-3 rounded-lg text-white text-xs font-medium transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                          style={{ backgroundColor: accentColor }}
                        >
                          {service.name} - ${service.price.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Badge */}
      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <div
          className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span>
          {displayMode === 'modal'
            ? `El botón flotante aparecerá en la posición ${
                triggerPosition === 'bottom-right' ? 'inferior derecha' :
                triggerPosition === 'bottom-left' ? 'inferior izquierda' :
                triggerPosition === 'top-right' ? 'superior derecha' :
                'superior izquierda'
              } de tu sitio web.`
            : 'El widget se mostrará embebido directamente en tu página donde coloques el contenedor.'
          }
        </span>
      </div>
    </div>
  );
}
