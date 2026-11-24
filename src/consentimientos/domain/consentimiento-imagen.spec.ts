import { afterEach, describe, expect, it, vi } from 'vitest';
import { requiereTutorParaImagen } from './consentimiento-imagen.js';

describe('Protección de menores para RF-20', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aplica el cumpleaños de 18 años en el calendario colombiano', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T04:59:59Z'));
    expect(requiereTutorParaImagen('2008-11-23')).toBe(true);
    vi.setSystemTime(new Date('2026-11-23T05:00:00Z'));
    expect(requiereTutorParaImagen('2008-11-23')).toBe(false);
  });

  it('exige tutor si la fecha es inválida o no se puede verificar', () => {
    expect(requiereTutorParaImagen('inválida')).toBe(true);
    expect(requiereTutorParaImagen('')).toBe(true);
  });
});
