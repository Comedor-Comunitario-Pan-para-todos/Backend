import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';
import {
  EstadoActaEnum,
  TipoDonanteEnum,
} from '../../dto/crear-acta-descarte.dto.js';
import { AutorizarActaDescarteUseCase } from './autorizar-acta-descarte.use-case.js';
import { ActaDescarteModel } from '../../domain/models/acta-descarte.model.js';
import type { ActaDescarteRepositoryPort } from '../../domain/ports/acta-descarte-repository.port.js';

describe('AutorizarActaDescarteUseCase', () => {
  let useCase: AutorizarActaDescarteUseCase;
  let mockRepo: ActaDescarteRepositoryPort;

  const coordinadora = {
    id: 'coord-uuid-1',
    email: 'coordinadora@comedor.org',
    nombreCompleto: 'Ana María Gómez',
    rol: { nombre: RolEnum.COORDINADORA },
  };

  const voluntario = {
    id: 'vol-uuid-1',
    email: 'carlos@comedor.org',
    nombreCompleto: 'Carlos Ruiz',
    rol: { nombre: RolEnum.VOLUNTARIO },
  };

  const actaPendiente = new ActaDescarteModel(
    'uuid-acta-1',
    'ACTA-2026-0001',
    'DON-1',
    'Pollo',
    20,
    'KG',
    TipoDonanteEnum.CORPORATIVO,
    'Olor fétido',
    EstadoActaEnum.PENDIENTE,
    [],
    'vol-uuid-1',
  );

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockImplementation((data) => Promise.resolve(data as any)),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === 'uuid-acta-1' ? actaPendiente : null),
      ),
      search: vi.fn(),
      generarSiguienteNumeroActa: vi.fn(),
    };

    useCase = new AutorizarActaDescarteUseCase(mockRepo);
  });

  it('debe autorizar el acta exitosamente cuando lo hace la COORDINADORA', async () => {
    const res = await useCase.execute(
      'uuid-acta-1',
      { observaciones: 'Verificado conforme a protocolo' },
      coordinadora,
    );

    expect(res.estado).toBe(EstadoActaEnum.AUTORIZADA);
    expect(res.autorizadaPorId).toBe(coordinadora.id);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar con ForbiddenException si el usuario no es COORDINADORA', async () => {
    await expect(
      useCase.execute('uuid-acta-1', {}, voluntario),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe lanzar NotFoundException si el acta no existe', async () => {
    await expect(
      useCase.execute('uuid-inexistente', {}, coordinadora),
    ).rejects.toThrow(NotFoundException);
  });
});
