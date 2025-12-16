/**
 * Valida un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono (básico, permite formatos internacionales)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Opcional
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida un nombre (no vacío, mínimo 2 caracteres)
 */
export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

/**
 * Mensajes de error de validación
 */
export const ValidationMessages = {
  name: 'El nombre debe tener al menos 2 caracteres',
  email: 'Por favor ingresa un email válido',
  phone: 'Por favor ingresa un teléfono válido',
  required: 'Este campo es requerido',
};
