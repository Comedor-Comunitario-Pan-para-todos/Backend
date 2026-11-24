import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RetencionService } from './retencion.service.js';

describe('RetencionService (RF-22)', () => {
  const repositorio = {
    consultar: vi.fn(),
    actualizar: vi.fn(),
    verificar: vi.fn(),
  };
  const service = new RetencionService(repositorio);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([null, -1, 0, 1.5, '30', 36501, NaN, Infinity])(
    'rechaza un plazo inválido %s antes de persistir',
    async (plazo) => {
      await expect(
        service.actualizar(
          { diasBasicos: 30, diasSensibles: plazo as number },
          'coord',
          'clave',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repositorio.actualizar).not.toHaveBeenCalled();
    },
  );

  it('propaga los dos plazos y confirma con el operador autenticado', async () => {
    const plazos = { diasBasicos: 1, diasSensibles: 36500 };
    const respuesta = {
      ...plazos,
      actualizadaPorId: 'coord',
      actualizadaEn: new Date(),
    };
    repositorio.actualizar.mockResolvedValue(respuesta);
    await expect(service.actualizar(plazos, 'coord', 'clave')).resolves.toEqual(
      respuesta,
    );
    expect(repositorio.actualizar).toHaveBeenCalledExactlyOnceWith(
      plazos,
      'coord',
      'clave',
    );
  });

  it('distingue una credencial no confirmada', async () => {
    repositorio.actualizar.mockResolvedValue(null);
    await expect(
      service.actualizar(
        { diasBasicos: 30, diasSensibles: 10 },
        'coord',
        'incorrecta',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
