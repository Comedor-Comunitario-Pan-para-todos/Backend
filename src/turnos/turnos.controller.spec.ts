import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TurnosController } from './turnos.controller.js';
import { TurnosService } from './turnos.service.js';
import { EstadoTurnoEnum } from './enums/estado-turno.enum.js';
import { TurnoModel } from './domain/models/turno.model.js';

describe('TurnosController (RF-03)', () => {
  let controller: TurnosController;
  let service: TurnosService;

  const mockService = {
    emitirTurno: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findHoyPorBeneficiario: vi.fn(),
    marcarAtendido: vi.fn(),
    cancelar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as any;
    controller = new TurnosController(service);
  });

  it('debe emitir turno extrayendo el ID del usuario del token JWT', async () => {
    const turno = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-voluntario-1',
      '08:30:00',
      EstadoTurnoEnum.EN_ESPERA,
    );
    mockService.emitirTurno.mockResolvedValue(turno);

    const req = { user: { id: 'uuid-voluntario-1' } };
    const res = await controller.emitirTurno({ beneficiarioId: 'uuid-beneficiario-1' }, req);

    expect(res).toEqual(turno);
    expect(mockService.emitirTurno).toHaveBeenCalledWith(
      { beneficiarioId: 'uuid-beneficiario-1' },
      'uuid-voluntario-1',
    );
  });

  it('debe consultar turnos en fila', async () => {
    const paginado = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    mockService.findAll.mockResolvedValue(paginado);

    const res = await controller.findAll({ page: 1, limit: 20 });
    expect(res).toEqual(paginado);
    expect(mockService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('debe consultar turno del día por beneficiario', async () => {
    mockService.findHoyPorBeneficiario.mockResolvedValue(null);

    const res = await controller.findHoyPorBeneficiario('uuid-beneficiario-1');
    expect(res).toBeNull();
    expect(mockService.findHoyPorBeneficiario).toHaveBeenCalledWith('uuid-beneficiario-1');
  });

  it('debe marcar turno como atendido', async () => {
    const turno = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-voluntario-1',
      '08:30:00',
      EstadoTurnoEnum.ATENDIDO,
    );
    mockService.marcarAtendido.mockResolvedValue(turno);

    const res = await controller.marcarAtendido('uuid-turno-1');
    expect(res.estado).toBe(EstadoTurnoEnum.ATENDIDO);
  });

  it('debe cancelar turno con motivo', async () => {
    const turno = new TurnoModel(
      'uuid-turno-1',
      '2026-11-21',
      1,
      'uuid-beneficiario-1',
      'uuid-voluntario-1',
      '08:30:00',
      EstadoTurnoEnum.CANCELADO,
      null,
      'Desistió',
    );
    mockService.cancelar.mockResolvedValue(turno);

    const res = await controller.cancelar('uuid-turno-1', { motivo: 'Desistió' });
    expect(res.estado).toBe(EstadoTurnoEnum.CANCELADO);
  });
});
