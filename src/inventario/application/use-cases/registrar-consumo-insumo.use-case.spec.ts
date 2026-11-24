import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EstadoLoteEnum,
  LoteInventarioModel,
  UnidadMedidaInsumoEnum,
} from '../../domain/models/lote-inventario.model.js';
import type { InventarioRepositoryPort } from '../../domain/ports/inventario-repository.port.js';
import { RegistrarConsumoInsumoUseCase } from './registrar-consumo-insumo.use-case.js';

describe('RegistrarConsumoInsumoUseCase', () => {
  let useCase: RegistrarConsumoInsumoUseCase;
  let mockRepo: InventarioRepositoryPort;

  let lote: LoteInventarioModel;

  beforeEach(() => {
    lote = new LoteInventarioModel(
      'lote-uuid-1',
      'LOT-001',
      'Aceite Vegetal',
      'Líquidos',
      20,
      20,
      UnidadMedidaInsumoEnum.L,
      new Date('2026-11-01'),
      new Date('2027-11-01'),
      EstadoLoteEnum.DISPONIBLE,
    );

    mockRepo = {
      save: vi.fn().mockImplementation((item: LoteInventarioModel) => Promise.resolve(item)),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === 'lote-uuid-1' ? lote : null),
      ),
      findByCodigoLote: vi.fn(),
      generarSiguienteCodigoLote: vi.fn(),
      search: vi.fn(),
      findDisponiblesPorInsumoOrdenadoPorVencimiento: vi.fn(),
    };
    useCase = new RegistrarConsumoInsumoUseCase(mockRepo);
  });

  it('debe descontar la cantidad consumida y guardar', async () => {
    const res = await useCase.execute('lote-uuid-1', { cantidad: 5, motivo: 'Cocina del día' });
    expect(res.cantidadActual).toBe(15);
    expect(res.estado).toBe(EstadoLoteEnum.DISPONIBLE);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe marcar el estado como AGOTADO si el saldo llega a 0', async () => {
    const res = await useCase.execute('lote-uuid-1', { cantidad: 20 });
    expect(res.cantidadActual).toBe(0);
    expect(res.estado).toBe(EstadoLoteEnum.AGOTADO);
  });

  it('debe lanzar BadRequestException si la cantidad a consumir supera el stock', async () => {
    await expect(useCase.execute('lote-uuid-1', { cantidad: 25 })).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si el lote no existe', async () => {
    await expect(useCase.execute('inexistente', { cantidad: 2 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
