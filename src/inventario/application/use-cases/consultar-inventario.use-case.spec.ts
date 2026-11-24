import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EstadoLoteEnum,
  LoteInventarioModel,
  UnidadMedidaInsumoEnum,
} from '../../domain/models/lote-inventario.model.js';
import type { InventarioRepositoryPort } from '../../domain/ports/inventario-repository.port.js';
import { ConsultarInventarioUseCase } from './consultar-inventario.use-case.js';

describe('ConsultarInventarioUseCase', () => {
  let useCase: ConsultarInventarioUseCase;
  let mockRepo: InventarioRepositoryPort;

  const mockLote = new LoteInventarioModel(
    'lote-uuid-1',
    'LOT-001',
    'Lentejas',
    'Legumbres',
    50,
    50,
    UnidadMedidaInsumoEnum.KG,
    new Date('2026-11-01'),
    new Date('2027-01-01'),
    EstadoLoteEnum.DISPONIBLE,
  );

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === 'lote-uuid-1' ? mockLote : null),
      ),
      findByCodigoLote: vi.fn(),
      generarSiguienteCodigoLote: vi.fn(),
      search: vi.fn().mockResolvedValue({
        data: [mockLote],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findDisponiblesPorInsumoOrdenadoPorVencimiento: vi.fn().mockResolvedValue([mockLote]),
    };
    useCase = new ConsultarInventarioUseCase(mockRepo);
  });

  it('debe retornar resultados paginados con filtros', async () => {
    const res = await useCase.consultar({ page: 1, limit: 10, nombreInsumo: 'Lentejas' });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(mockRepo.search).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, nombreInsumo: 'Lentejas' }),
    );
  });

  it('debe retornar un lote específico por ID', async () => {
    const res = await useCase.consultarPorId('lote-uuid-1');
    expect(res).toBeDefined();
    expect(res.id).toBe('lote-uuid-1');
  });

  it('debe lanzar NotFoundException si el lote no existe', async () => {
    await expect(useCase.consultarPorId('id-inexistente')).rejects.toThrow(NotFoundException);
  });

  it('debe retornar lotes disponibles ordenados por vencimiento para rotación FEFO', async () => {
    const res = await useCase.consultarLotesDisponiblesParaConsumo('Lentejas');
    expect(res).toHaveLength(1);
    expect(mockRepo.findDisponiblesPorInsumoOrdenadoPorVencimiento).toHaveBeenCalledWith('Lentejas');
  });
});
