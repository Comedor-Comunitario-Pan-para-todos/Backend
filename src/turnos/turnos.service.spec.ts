import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TurnosService } from './turnos.service.js';
import { EstadoTurnoEnum } from './enums/estado-turno.enum.js';
import { TurnoModel } from './domain/models/turno.model.js';

describe('TurnosService (RF-03)', () => {
  let service: TurnosService;

  const mockEmitirTurnoUseCase = {
    execute: vi.fn(),
  };

  const mockConsultarTurnosUseCase = {
    listar: vi.fn(),
    consultarPorId: vi.fn(),
    consultarPorBeneficiarioHoy: vi.fn(),
  };

  const mockCambiarEstadoTurnoUseCase = {
    marcarAtendido: vi.fn(),
    cancelar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TurnosService(
      mockEmitirTurnoUseCase as any,
      mockConsultarTurnosUseCase as any,
      mockCambiarEstadoTurnoUseCase as any,
    );
  });

  it('debe emitir turno delegando en EmitirTurnoUseCase', async () => {
    const turno = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-usuario-1',
      '08:30:00',
      EstadoTurnoEnum.EN_ESPERA,
    );
    mockEmitirTurnoUseCase.execute.mockResolvedValue(turno);

    const res = await service.emitirTurno(
      { beneficiarioId: 'uuid-beneficiario-1' },
      'uuid-usuario-1',
    );

    expect(res).toEqual(turno);
    expect(mockEmitirTurnoUseCase.execute).toHaveBeenCalledWith(
      'uuid-beneficiario-1',
      'uuid-usuario-1',
    );
  });

  it('debe listar turnos delegando en ConsultarTurnosUseCase', async () => {
    const paginado = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    mockConsultarTurnosUseCase.listar.mockResolvedValue(paginado);

    const res = await service.findAll({ page: 1, limit: 20 });
    expect(res).toEqual(paginado);
    expect(mockConsultarTurnosUseCase.listar).toHaveBeenCalled();
  });

  it('debe consultar turno por ID', async () => {
    const turno = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-usuario-1',
      '08:30:00',
      EstadoTurnoEnum.EN_ESPERA,
    );
    mockConsultarTurnosUseCase.consultarPorId.mockResolvedValue(turno);

    const res = await service.findOne('uuid-turno-1');
    expect(res).toEqual(turno);
    expect(mockConsultarTurnosUseCase.consultarPorId).toHaveBeenCalledWith('uuid-turno-1');
  });

  it('debe marcar turno como atendido', async () => {
    const turnoAtendido = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-usuario-1',
      '08:30:00',
      EstadoTurnoEnum.ATENDIDO,
      '08:45:00',
    );
    mockCambiarEstadoTurnoUseCase.marcarAtendido.mockResolvedValue(turnoAtendido);

    const res = await service.marcarAtendido('uuid-turno-1');
    expect(res.estado).toBe(EstadoTurnoEnum.ATENDIDO);
    expect(mockCambiarEstadoTurnoUseCase.marcarAtendido).toHaveBeenCalledWith('uuid-turno-1');
  });

  it('debe cancelar turno', async () => {
    const turnoCancelado = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-usuario-1',
      '08:30:00',
      EstadoTurnoEnum.CANCELADO,
      null,
      'Retiro voluntario',
    );
    mockCambiarEstadoTurnoUseCase.cancelar.mockResolvedValue(turnoCancelado);

    const res = await service.cancelar('uuid-turno-1', { motivo: 'Retiro voluntario' });
    expect(res.estado).toBe(EstadoTurnoEnum.CANCELADO);
    expect(mockCambiarEstadoTurnoUseCase.cancelar).toHaveBeenCalledWith(
      'uuid-turno-1',
      'Retiro voluntario',
    );
  });
});
