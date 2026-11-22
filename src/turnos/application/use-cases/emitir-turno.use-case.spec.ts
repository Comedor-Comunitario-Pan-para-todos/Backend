import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmitirTurnoUseCase } from './emitir-turno.use-case.js';
import { EstadoTurnoEnum } from '../../enums/estado-turno.enum.js';
import { TurnoModel } from '../../domain/models/turno.model.js';
import { TurnoRepositoryPort } from '../../domain/ports/turno-repository.port.js';
import { BeneficiarioRepositoryPort } from '../../../beneficiarios/domain/ports/beneficiario-repository.port.js';
import { BeneficiarioModel } from '../../../beneficiarios/domain/models/beneficiario.model.js';

describe('EmitirTurnoUseCase (RF-03, HU-26, HU-27)', () => {
  let useCase: EmitirTurnoUseCase;

  const mockTurnoRepo: TurnoRepositoryPort = {
    save: vi.fn(),
    obtenerSiguienteNumeroTurno: vi.fn(),
    findByBeneficiarioYFecha: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    updateEstado: vi.fn(),
  };

  const mockBeneficiarioRepo: BeneficiarioRepositoryPort = {
    findById: vi.fn(),
    findByDocumento: vi.fn(),
    findByDatosBasicos: vi.fn(),
    save: vi.fn(),
    search: vi.fn(),
    softDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new EmitirTurnoUseCase(mockTurnoRepo, mockBeneficiarioRepo);
  });

  it('debe emitir un turno secuencial exitosamente para un beneficiario verificado (HU-26)', async () => {
    const beneficiarioId = 'uuid-beneficiario-1';
    const usuarioId = 'uuid-voluntario-1';

    vi.mocked(mockBeneficiarioRepo.findById).mockResolvedValue(
      new BeneficiarioModel(beneficiarioId, undefined, 'CC', '1088234567', 'Ana', 'Ríos'),
    );
    vi.mocked(mockTurnoRepo.findByBeneficiarioYFecha).mockResolvedValue(null);
    vi.mocked(mockTurnoRepo.obtenerSiguienteNumeroTurno).mockResolvedValue(1);

    const turnoEsperado = new TurnoModel(
      'uuid-turno-1',
      new Date().toISOString().slice(0, 10),
      1,
      beneficiarioId,
      usuarioId,
      '08:30:00',
      EstadoTurnoEnum.EN_ESPERA,
    );
    vi.mocked(mockTurnoRepo.save).mockResolvedValue(turnoEsperado);

    const resultado = await useCase.execute(beneficiarioId, usuarioId);

    expect(resultado).toBeDefined();
    expect(resultado.numeroTurno).toBe(1);
    expect(resultado.estado).toBe(EstadoTurnoEnum.EN_ESPERA);
    expect(mockBeneficiarioRepo.findById).toHaveBeenCalledWith(beneficiarioId);
    expect(mockTurnoRepo.obtenerSiguienteNumeroTurno).toHaveBeenCalled();
    expect(mockTurnoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroTurno: 1,
        beneficiarioId,
        emitidoPorUsuarioId: usuarioId,
        estado: EstadoTurnoEnum.EN_ESPERA,
      }),
    );
  });

  it('debe rechazar con NotFoundException (404) si el beneficiario no existe en el padrón central (HU-26 Criterio 1)', async () => {
    vi.mocked(mockBeneficiarioRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('uuid-inexistente', 'uuid-voluntario-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockTurnoRepo.save).not.toHaveBeenCalled();
  });

  it('debe bloquear la acción con ConflictException (409) si el beneficiario ya tiene turno asignado hoy (HU-27 Prevención duplicados)', async () => {
    const beneficiarioId = 'uuid-beneficiario-1';
    const usuarioId = 'uuid-voluntario-1';
    const fechaHoy = new Date().toISOString().slice(0, 10);

    vi.mocked(mockBeneficiarioRepo.findById).mockResolvedValue(
      new BeneficiarioModel(beneficiarioId, undefined, 'CC', '1088234567', 'Ana', 'Ríos'),
    );

    // Ya existe turno emitido previamente en la misma fecha
    const turnoExistente = new TurnoModel(
      'uuid-turno-previo',
      fechaHoy,
      5,
      beneficiarioId,
      usuarioId,
      '08:15:00',
      EstadoTurnoEnum.EN_ESPERA,
    );
    vi.mocked(mockTurnoRepo.findByBeneficiarioYFecha).mockResolvedValue(turnoExistente);

    await expect(useCase.execute(beneficiarioId, usuarioId)).rejects.toThrow(ConflictException);
    expect(mockTurnoRepo.save).not.toHaveBeenCalled();
  });
});
