import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(url => url.trim()) || [
  'http://localhost:3000',
  'http://localhost:3001',
];

// Log de configuración CORS al iniciar (solo en desarrollo o para debug)
console.log('🔧 CORS Configuration:');
console.log('Raw CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('Allowed Origins:', allowedOrigins);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Log para debugging
    console.log('🌐 CORS check - Origin:', origin, '| Allowed:', allowedOrigins.includes(origin || ''));

    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('❌ CORS rejected:', origin);
      console.error('   Expected one of:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Koru-Website-Id',
    'X-Koru-App-Id',
  ],
});
