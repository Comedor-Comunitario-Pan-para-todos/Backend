import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ConsultarExcepcionesUseCase } from './consultar-excepciones.use-case.js';
import { ExcepcionEntregaRepositoryPort } from '../../domain/ports/excepcion-entrega-repository.port.js';
import { TipoExcepcionEnum } from '../../enums/tipo-excepcion.enum.js';

describe('ConsultarExcepcionesUseCase', () => {
  let useCase: ConsultarExcepcionesUseCase;
  let excepcionRepo: ExcepcionEntregaRepositoryPort;

  const mockExcepcion = {
    id: 'ex-uuid-1',
    turnoId: 't-uuid-1',
    autorizadoPorUsuarioId: 'u-uuid-1',
    tipoExcepcion: TipoExcepcionEnum.RACION_EXTRA,
    justificacion: 'Familia numerosa',
    cantidadRaciones: 2,
    fechaHora: new Date(),
  };

  beforeEach(() => {
    excepcionRepo = {
      save: vi.fn(),
      findById: vi.fn().mockImplementation((id) =>
        id === 'ex-uuid-1' ? Promise.resolve(mockExcepcion) : Promise.resolve(null),
      ),
      findByTurnoId: vi.fn().mockImplementation((turnoId) =>
        turnoId === 't-uuid-1' ? Promise.resolve(mockExcepcion) : Promise.resolve(null),
      ),
      findAll: vi.fn().mockResolvedValue({
        data: [mockExcepcion],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
    };

    useCase = new ConsultarExcepcionesUseCase(excepcionRepo);
  });

  it('debe consultar excepciones con paginación correctamente', async () => {
    const res = await useCase.execute({ page: 1, limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(1);
  });

  it('debe encontrar una excepción por ID existente', async () => {
    const res = await useCase.findById('ex-uuid-1');
    expect(res.id).toBe('ex-uuid-1');
  });

  it('debe lanzar NotFoundException si no existe por ID', async () => {
    await expect(useCase.findById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('debe encontrar una excepción por turnoId', async () => {
    const res = await useCase.findByTurnoId('t-uuid-1');
    expect(res.turnoId).toBe('t-uuid-1');
  });

  it('debe lanzar NotFoundException si no existe por turnoId', async () => {
    await expect(useCase.findByTurnoId('non-existent')).rejects.toThrow(NotFoundException);
  });
});
