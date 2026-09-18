export const PIN_LENGTH = 5;
export const PIN_MAX_INTENTOS = 5;

export type PinResetStatus = 'pendiente' | 'autorizado' | 'usado' | 'rechazado';

export interface PinResetSolicitud {
  cedula: string;
  nombres: string;
  requestedAt: string;
  status: PinResetStatus;
  authorizedAt?: string;
  usedAt?: string;
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export function pinWeakReason(pin: string, cedula?: string): string | null {
  if (!isValidPin(pin)) {
    return `El PIN debe tener exactamente ${PIN_LENGTH} números.`;
  }
  if (/^(\d)\1{4}$/.test(pin)) {
    return 'No uses 5 dígitos iguales (ej. 11111).';
  }
  if (pin === '12345' || pin === '54321') {
    return 'Ese PIN es demasiado predecible.';
  }
  const digits = String(cedula || '').replace(/\D/g, '');
  if (digits && (pin === digits.slice(-5) || pin === digits.slice(0, 5))) {
    return 'No uses dígitos de tu cédula como PIN.';
  }
  return null;
}
