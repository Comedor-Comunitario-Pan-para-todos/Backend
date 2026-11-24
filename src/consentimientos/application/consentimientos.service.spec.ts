import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetodoConsentimiento } from '../domain/consentimiento.js';
import { ConsentimientosService } from './consentimientos.service.js';

const aceptacion = {
  aceptado: true,
  versionTexto: 1,
  finalidad: 'ATENCION_ALIMENTARIA' as const,
  metodo: MetodoConsentimiento.VERBAL_CON_TESTIGO,
};

describe('ConsentimientosService (RF-19)', () => {
  const registrar = vi.fn();
  const service = new ConsentimientosService({
    registrar,
    buscarVigentes: vi.fn(),
    buscarImagenesVigentes: vi.fn(),
    revocarImagen: vi.fn(),
    historialImagen: vi.fn(),
  });

  beforeEach(() => {
    registrar.mockReset();
  });

  it('registra la versión, finalidad y método con fecha y operador del servidor', async () => {
    registrar.mockImplementation((consentimiento: unknown) =>
      Promise.resolve({ creado: true, consentimiento }),
    );
    const datos = {
      ...aceptacion,
      registradoPorId: 'manipulado',
      registradoEn: new Date(0),
    };
    const { consentimiento: resultado } = await service.registrar(
      'beneficiario',
      datos,
      'operador',
    );
    expect(resultado).toEqual({
      ...aceptacion,
      id: expect.any(String),
      beneficiarioId: 'beneficiario',
      registradoPorId: 'operador',
      registradoEn: expect.any(Date),
    });
    expect(resultado.registradoEn.getTime()).toBeGreaterThan(0);
    expect(registrar).toHaveBeenCalledExactlyOnceWith(resultado);
  });

  it('rechaza la negativa sin iniciar ninguna escritura', async () => {
    await expect(
      service.registrar(
        'beneficiario',
        { ...aceptacion, aceptado: false },
        'operador',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(registrar).not.toHaveBeenCalled();
  });

  it('responde 404 si no existe un beneficiario activo', async () => {
    registrar.mockResolvedValue(null);
    await expect(
      service.registrar('beneficiario', aceptacion, 'operador'),
    ).rejects.toThrow(NotFoundException);
  });

  it('devuelve la evidencia original al repetir la misma versión', async () => {
    const original = {
      ...aceptacion,
      id: 'original',
      beneficiarioId: 'beneficiario',
      registradoPorId: 'primer-operador',
      registradoEn: new Date(0),
    };
    registrar.mockResolvedValue({ creado: false, consentimiento: original });
    await expect(
      service.registrar('beneficiario', aceptacion, 'segundo-operador'),
    ).resolves.toEqual({ creado: false, consentimiento: original });
  });

  it('propaga un fallo de persistencia sin devolver evidencia', async () => {
    const error = new Error('Escritura no disponible');
    registrar.mockRejectedValue(error);
    await expect(
      service.registrar('beneficiario', aceptacion, 'operador'),
    ).rejects.toBe(error);
  });
});
