import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DescarteModel } from '../../domain/models/descarte.model.js';
import type { DescarteRepositoryPort } from '../../domain/ports/descarte-repository.port.js';
import { ConsultarDescartesUseCase } from './consultar-descartes.use-case.js';

describe('ConsultarDescartesUseCase', () => {
  let useCase: ConsultarDescartesUseCase;
  let mockRepo: DescarteRepositoryPort;

  const descarteEjemplo = new DescarteModel(
    'uuid-descarte-1',
    'Arroz',
    20,
    'KG',
    'Contaminación por gorgojo',
    new Date(),
    'Mario',
    'uuid-coord-1',
  );

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === 'uuid-descarte-1' ? descarteEjemplo : null),
      ),
      search: vi.fn().mockResolvedValue({
        data: [descarteEjemplo],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
    };

    useCase = new ConsultarDescartesUseCase(mockRepo);
  });

  it('debe listar descartes paginados correctamente', async () => {
    const res = await useCase.executeListar({ page: 1, limit: 10 });

    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(1);
    expect(mockRepo.search).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('debe obtener un descarte por su ID', async () => {
    const res = await useCase.executeObtenerPorId('uuid-descarte-1');
    expect(res.id).toBe('uuid-descarte-1');
    expect(res.alimento).toBe('Arroz');
  });

  it('debe lanzar NotFoundException si el descarte no existe', async () => {
    await expect(useCase.executeObtenerPorId('uuid-inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
