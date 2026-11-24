import { afterEach, describe, expect, it, vi } from 'vitest';
import { imagenAplicaParaEdad } from './consentimiento-imagen.js';

describe('Protección de menores para RF-21', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aplica el cumpleaños de 18 años en el calendario colombiano', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T04:59:59Z'));
    expect(imagenAplicaParaEdad('2008-11-23', 'tutor', 'tutor')).toBe(true);
    expect(imagenAplicaParaEdad('2008-11-23', null)).toBe(false);
    vi.setSystemTime(new Date('2026-11-23T05:00:00Z'));
    expect(imagenAplicaParaEdad('2008-11-23', 'tutor', 'tutor')).toBe(false);
    expect(imagenAplicaParaEdad('2008-11-23', null)).toBe(true);
  });

  it('exige que la evidencia corresponda al tutor activo', () => {
    expect(
      imagenAplicaParaEdad('2015-06-01', 'tutor-anterior', 'tutor-nuevo'),
    ).toBe(false);
    expect(imagenAplicaParaEdad('2015-06-01', 'tutor-revocado')).toBe(false);
    expect(
      imagenAplicaParaEdad('2015-06-01', 'tutor-vigente', 'tutor-vigente'),
    ).toBe(true);
  });

  it('exige tutor si la fecha es inválida o no se puede verificar', () => {
    expect(imagenAplicaParaEdad('inválida', 'tutor', 'tutor')).toBe(false);
    expect(imagenAplicaParaEdad('', null)).toBe(false);
    expect(imagenAplicaParaEdad('1990-02-31', null)).toBe(false);
  });
});
