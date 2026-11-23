import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';
import { RegistrarDescarteUseCase } from './registrar-descarte.use-case.js';
import { DescarteModel } from '../../domain/models/descarte.model.js';
import type { DescarteRepositoryPort } from '../../domain/ports/descarte-repository.port.js';

describe('RegistrarDescarteUseCase', () => {
  let useCase: RegistrarDescarteUseCase;
  let mockRepo: DescarteRepositoryPort;

  const mockCoordinadora = {
    id: 'uuid-coordinadora-1',
    email: 'coordinadora@comedor.org',
    nombreCompleto: 'Ana María Gómez',
    rol: { nombre: RolEnum.COORDINADORA },
  };

  const mockVoluntario = {
    id: 'uuid-voluntario-1',
    email: 'voluntario@comedor.org',
    nombreCompleto: 'Carlos Ruiz',
    rol: { nombre: RolEnum.VOLUNTARIO },
  };

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockImplementation((data) =>
        Promise.resolve(
          new DescarteModel(
            'uuid-descarte-1',
            data.alimento,
            data.cantidad,
            data.unidadMedida,
            data.motivo,
            data.fecha,
            data.evaluadoPor,
            data.autorizadoPorId,
            data.loteId,
          ),
        ),
      ),
      findById: vi.fn(),
      search: vi.fn(),
    };

    useCase = new RegistrarDescarteUseCase(mockRepo);
  });

  it('debe registrar un descarte exitosamente cuando lo autoriza la COORDINADORA', async () => {
    const dto = {
      alimento: 'Tomate chonto',
      cantidad: 15,
      unidadMedida: 'KG',
      motivo: 'Presencia de hongos en almacenamiento',
      evaluadoPor: 'Mario (Cocinero)',
      loteId: 'lote-101',
    };

    const resultado = await useCase.execute(dto, mockCoordinadora);

    expect(resultado).toBeDefined();
    expect(resultado.alimento).toBe('Tomate chonto');
    expect(resultado.cantidad).toBe(15);
    expect(resultado.autorizadoPorId).toBe(mockCoordinadora.id);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar con ForbiddenException si el usuario autorizador no es COORDINADORA', async () => {
    const dto = {
      alimento: 'Carne de res',
      cantidad: 5,
      unidadMedida: 'KG',
      motivo: 'Olor fétido',
      evaluadoPor: 'Mario',
    };

    await expect(useCase.execute(dto, mockVoluntario)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar error si la cantidad a descartar es menor o igual a cero', async () => {
    const dto = {
      alimento: 'Papas',
      cantidad: 0,
      unidadMedida: 'KG',
      motivo: 'Brotadas',
      evaluadoPor: 'Mario',
    };

    await expect(useCase.execute(dto, mockCoordinadora)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
