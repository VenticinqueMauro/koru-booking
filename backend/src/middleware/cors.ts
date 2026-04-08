import cors from 'cors';

// Widget embebido en sitios de terceros — acepta cualquier origen.
// Se refleja el origin del request para mantener compatibilidad con credentials.
export const corsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Koru-Website-Id',
    'X-Koru-App-Id',
  ],
});
