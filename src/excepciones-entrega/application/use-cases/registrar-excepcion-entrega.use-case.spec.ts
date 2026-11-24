import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RegistrarExcepcionEntregaUseCase } from './registrar-excepcion-entrega.use-case.js';
import { ExcepcionEntregaRepositoryPort } from '../../domain/ports/excepcion-entrega-repository.port.js';
import { TurnoRepositoryPort } from '../../../turnos/domain/ports/turno-repository.port.js';
import { UsuarioRepositoryPort } from '../../../usuarios/domain/ports/usuario-repository.port.js';
import { TipoExcepcionEnum } from '../../enums/tipo-excepcion.enum.js';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';
import { EstadoTurnoEnum } from '../../../turnos/enums/estado-turno.enum.js';

describe('RegistrarExcepcionEntregaUseCase', () => {
  let useCase: RegistrarExcepcionEntregaUseCase;
  let excepcionRepo: ExcepcionEntregaRepositoryPort;
  let turnoRepo: TurnoRepositoryPort;
  let usuarioRepo: UsuarioRepositoryPort;

  const mockDto = {
    turnoId: '11111111-1111-1111-1111-111111111111',
    autorizadoPorUsuarioId: '22222222-2222-2222-2222-222222222222',
    tipoExcepcion: TipoExcepcionEnum.RACION_EXTRA,
    justificacion: 'Familiar dependiente con discapacidad en el mismo hogar',
    cantidadRaciones: 1,
  };

  const mockTurno = {
    id: '11111111-1111-1111-1111-111111111111',
    fecha: '2026-11-24',
    numeroTurno: 5,
    beneficiarioId: '33333333-3333-3333-3333-333333333333',
    emitidoPorUsuarioId: '44444444-4444-4444-4444-444444444444',
    horaLlegada: '11:00:00',
    estado: EstadoTurnoEnum.EN_ESPERA,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCoordinadora = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'coordinadora@panparatodos.org',
    nombreCompleto: 'Lucía Gómez',
    activo: true,
    rol: {
      id: 'r1',
      nombre: RolEnum.COORDINADORA,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    excepcionRepo = {
      save: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'ex-uuid-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findById: vi.fn(),
      findByTurnoId: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
    };

    turnoRepo = {
      save: vi.fn(),
      obtenerSiguienteNumeroTurno: vi.fn(),
      findByBeneficiarioYFecha: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockTurno),
      findAll: vi.fn(),
      updateEstado: vi.fn(),
    };

    usuarioRepo = {
      findById: vi.fn().mockResolvedValue(mockCoordinadora),
      findByEmail: vi.fn(),
      findAndPaginate: vi.fn(),
      save: vi.fn(),
      countCoordinadorasActivas: vi.fn(),
      findRolByNombre: vi.fn(),
    };

    useCase = new RegistrarExcepcionEntregaUseCase(
      excepcionRepo,
      turnoRepo,
      usuarioRepo,
    );
  });

  it('debe registrar exitosamente una excepción de entrega con datos válidos', async () => {
    const resultado = await useCase.execute(mockDto);

    expect(resultado).toBeDefined();
    expect(resultado.id).toBe('ex-uuid-1');
    expect(resultado.turnoId).toBe(mockDto.turnoId);
    expect(resultado.justificacion).toBe(mockDto.justificacion);
    expect(resultado.cantidadRaciones).toBe(1);
    expect(excepcionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar BadRequestException si la justificación está vacía', async () => {
    await expect(
      useCase.execute({ ...mockDto, justificacion: '   ' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar BadRequestException si la justificación supera 255 caracteres', async () => {
    const justificacionLarga = 'A'.repeat(256);
    await expect(
      useCase.execute({ ...mockDto, justificacion: justificacionLarga }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar BadRequestException si la cantidad de raciones es menor o igual a 0', async () => {
    await expect(
      useCase.execute({ ...mockDto, cantidadRaciones: 0 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar NotFoundException si el turno de atención no existe', async () => {
    vi.mocked(turnoRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(mockDto)).rejects.toThrow(NotFoundException);
    expect(excepcionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ConflictException si ya existe una excepción registrada para ese turno (Relación 1:1 única)', async () => {
    vi.mocked(excepcionRepo.findByTurnoId).mockResolvedValueOnce({
      id: 'existing-ex',
      turnoId: mockDto.turnoId,
      autorizadoPorUsuarioId: 'other-user',
      tipoExcepcion: TipoExcepcionEnum.MERCADO_LLEVAR,
      justificacion: 'Previa',
      cantidadRaciones: 1,
      fechaHora: new Date(),
    });

    await expect(useCase.execute(mockDto)).rejects.toThrow(ConflictException);
    expect(excepcionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si el usuario autorizador no existe', async () => {
    vi.mocked(usuarioRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(mockDto)).rejects.toThrow(NotFoundException);
    expect(excepcionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el autorizador no tiene rol de COORDINADORA (HU-19)', async () => {
    vi.mocked(usuarioRepo.findById).mockResolvedValueOnce({
      ...mockCoordinadora,
      rol: { id: 'r2', nombre: RolEnum.VOLUNTARIO },
    });

    await expect(useCase.execute(mockDto)).rejects.toThrow(BadRequestException);
    expect(excepcionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el autorizador está inactivo', async () => {
    vi.mocked(usuarioRepo.findById).mockResolvedValueOnce({
      ...mockCoordinadora,
      activo: false,
    });

    await expect(useCase.execute(mockDto)).rejects.toThrow(BadRequestException);
    expect(excepcionRepo.save).not.toHaveBeenCalled();
  });
});
