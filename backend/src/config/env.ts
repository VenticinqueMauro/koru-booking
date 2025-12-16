import { z } from 'zod';

/**
 * Environment Variables Schema
 * Valida que todas las variables de entorno requeridas estén presentes
 * y tengan el formato correcto al iniciar la aplicación.
 */
const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .transform(Number)
    .default('4000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (url) => url.startsWith('postgresql://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

  // Supabase (opcional, solo si usas Supabase client)
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required for sending emails').optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email').default('noreply@example.com'),

  // Koru Platform
  KORU_API_URL: z.string().url('KORU_API_URL must be a valid URL').optional(),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:3001'),
});

/**
 * Tipo inferido del schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Valida y parsea las variables de entorno
 * Falla rápido si hay errores de configuración
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error('');

      error.errors.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });

      console.error('');
      console.error('Please check your .env file and ensure all required variables are set correctly.');
      console.error('See .env.example for reference.');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Variables de entorno validadas
 * Usar este objeto en lugar de process.env para tener type safety
 */
export const env = validateEnv();
