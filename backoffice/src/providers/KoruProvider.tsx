import { KoruProvider, KoruProtected } from '@redclover/koru-react-sdk';
import { ReactNode } from 'react';

export function KoruWrapper({ children }: { children: ReactNode }) {
  // En desarrollo, renderizamos directamente los hijos para evitar
  // que el SDK de Koru intente autenticarse con el servidor remoto.
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }

  return (
    <KoruProvider
      websiteId={import.meta.env.VITE_KORU_WEBSITE_ID}
      appId={import.meta.env.VITE_KORU_APP_ID}
      koruUrl={import.meta.env.VITE_KORU_URL || 'https://app.koru.com'}
      options={{ cache: true, debug: false }}
    >
      <KoruProtected
        loading={<LoadingScreen />}
        fallback={<AccessDenied />}
      >
        {children}
      </KoruProtected>
    </KoruProvider>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <h2>Verificando autorización...</h2>
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <h1>🚫 Acceso Denegado</h1>
      <p>No tienes permisos para acceder a este panel.</p>
    </div>
  );
}
