import { describe, expect, it, vi } from 'vitest';
import {
  CadenaFrioService,
  EquipoNoDisponibleError,
} from './cadena-frio.service.js';

const reporte = {
  equipoId: 'equipo',
  temperaturaObservada: -2,
  minutosTranscurridos: 30,
  insumosAfectados: ['Leche'],
  accionCorrectiva: 'Trasladar los insumos',
};

describe('CadenaFrioService', () => {
  it('propaga al adaptador la identidad autenticada para la auditoría y el reporte', async () => {
    const incidente = {
      ...reporte,
      id: 'incidente',
      reportadoPorId: 'voluntario',
      registradoEn: new Date(),
    };
    const repository = {
      listarEquipos: vi.fn().mockResolvedValue([]),
      registrar: vi.fn().mockResolvedValue(incidente),
    };
    const service = new CadenaFrioService(repository);

    await expect(service.listarEquipos('voluntario')).resolves.toEqual([]);
    expect(repository.listarEquipos).toHaveBeenCalledWith('voluntario');
    await expect(service.registrar(reporte, 'voluntario')).resolves.toEqual(
      incidente,
    );
    expect(repository.registrar).toHaveBeenCalledWith(reporte, 'voluntario');
  });

  it('rechaza el reporte si el equipo no está disponible', async () => {
    const service = new CadenaFrioService({
      listarEquipos: vi.fn(),
      registrar: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.registrar(reporte, 'voluntario'),
    ).rejects.toBeInstanceOf(EquipoNoDisponibleError);
  });
});
