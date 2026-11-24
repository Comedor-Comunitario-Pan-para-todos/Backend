import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcepcionesEntregaController } from './excepciones-entrega.controller.js';
import { RegistrarExcepcionEntregaUseCase } from './application/use-cases/registrar-excepcion-entrega.use-case.js';
import { ConsultarExcepcionesUseCase } from './application/use-cases/consultar-excepciones.use-case.js';
import { TipoExcepcionEnum } from './enums/tipo-excepcion.enum.js';

describe('ExcepcionesEntregaController', () => {
  let controller: ExcepcionesEntregaController;
  let registrarUseCase: RegistrarExcepcionEntregaUseCase;
  let consultarUseCase: ConsultarExcepcionesUseCase;

  const mockExcepcion = {
    id: 'ex-1',
    turnoId: 't-1',
    autorizadoPorUsuarioId: 'u-1',
    tipoExcepcion: TipoExcepcionEnum.RACION_EXTRA,
    justificacion: 'Adulto mayor dependiente',
    cantidadRaciones: 1,
    fechaHora: new Date(),
  };

  beforeEach(() => {
    registrarUseCase = {
      execute: vi.fn().mockResolvedValue(mockExcepcion),
    } as unknown as RegistrarExcepcionEntregaUseCase;

    consultarUseCase = {
      execute: vi.fn().mockResolvedValue({
        data: [mockExcepcion],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      findById: vi.fn().mockResolvedValue(mockExcepcion),
      findByTurnoId: vi.fn().mockResolvedValue(mockExcepcion),
    } as unknown as ConsultarExcepcionesUseCase;

    controller = new ExcepcionesEntregaController(registrarUseCase, consultarUseCase);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  it('debe registrar una excepción llamando al caso de uso', async () => {
    const dto = {
      turnoId: 't-1',
      autorizadoPorUsuarioId: 'u-1',
      tipoExcepcion: TipoExcepcionEnum.RACION_EXTRA,
      justificacion: 'Adulto mayor dependiente',
      cantidadRaciones: 1,
    };

    const res = await controller.registrar(dto);
    expect(res).toEqual(mockExcepcion);
    expect(registrarUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('debe consultar excepciones paginadas', async () => {
    const res = await controller.consultar({ page: 1, limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(consultarUseCase.execute).toHaveBeenCalled();
  });

  it('debe consultar por turnoId', async () => {
    const res = await controller.consultarPorTurno('t-1');
    expect(res).toEqual(mockExcepcion);
    expect(consultarUseCase.findByTurnoId).toHaveBeenCalledWith('t-1');
  });

  it('debe consultar por ID', async () => {
    const res = await controller.consultarPorId('ex-1');
    expect(res).toEqual(mockExcepcion);
    expect(consultarUseCase.findById).toHaveBeenCalledWith('ex-1');
  });
});
