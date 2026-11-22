import type { DataSource, EntityManager } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TipoEquipoRefrigeracion } from '../../../../domain/cadena-frio.js';
import {
  accesoCatalogoSchema,
  equipoRefrigeracionSchema,
  incidenteCadenaFrioSchema,
} from './cadena-frio.schemas.js';
import { CadenaFrioTypeOrmAdapter } from './cadena-frio-typeorm.adapter.js';

const equipo = {
  id: 'nevera-1',
  nombre: 'Nevera cocina',
  tipo: TipoEquipoRefrigeracion.NEVERA,
  activo: true,
};
const reporte = {
  equipoId: equipo.id,
  temperaturaObservada: -4.5,
  minutosTranscurridos: 0,
  insumosAfectados: [],
  accionCorrectiva: 'Trasladar insumos',
};
const actor = 'voluntario-1';

describe('CadenaFrioTypeOrmAdapter (RF-10)', () => {
  const manager = { find: vi.fn(), findOne: vi.fn(), insert: vi.fn() };
  const transaction = vi.fn(
    (work: (entityManager: EntityManager) => Promise<unknown>) =>
      work(manager as unknown as EntityManager),
  );
  const adapter = new CadenaFrioTypeOrmAdapter({
    transaction,
  } as unknown as DataSource);

  beforeEach(() => {
    vi.resetAllMocks();
    manager.find.mockResolvedValue([equipo]);
    manager.findOne.mockResolvedValue(equipo);
    manager.insert.mockResolvedValue(undefined);
  });

  describe('listarEquipos', () => {
    it('devuelve el catálogo ordenado y registra la consulta en la misma transacción', async () => {
      await expect(adapter.listarEquipos(actor)).resolves.toEqual([equipo]);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(manager.find).toHaveBeenCalledWith(equipoRefrigeracionSchema, {
        order: { nombre: 'ASC', id: 'ASC' },
      });
      expect(manager.insert).toHaveBeenCalledExactlyOnceWith(
        accesoCatalogoSchema,
        {
          id: expect.any(String),
          usuarioId: actor,
          consultadoEn: expect.any(Date),
        },
      );
    });

    it('audita una consulta aunque el catálogo esté vacío', async () => {
      manager.find.mockResolvedValue([]);
      await expect(adapter.listarEquipos(actor)).resolves.toEqual([]);
      expect(manager.insert).toHaveBeenCalledTimes(1);
    });

    it('omite la auditoría de éxito si falla la consulta', async () => {
      const error = new Error('Consulta fallida');
      manager.find.mockRejectedValue(error);
      await expect(adapter.listarEquipos(actor)).rejects.toBe(error);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('propaga el fallo cuando la auditoría no puede guardarse', async () => {
      const error = new Error('Auditoría no disponible');
      manager.insert.mockRejectedValue(error);
      await expect(adapter.listarEquipos(actor)).rejects.toBe(error);
    });
  });

  describe('registrar', () => {
    it('bloquea el equipo activo e inserta el reporte con fecha y actor del servidor', async () => {
      const incidente = await adapter.registrar(reporte, actor);
      expect(incidente).toEqual({
        ...reporte,
        id: expect.any(String),
        reportadoPorId: actor,
        registradoEn: expect.any(Date),
      });
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(manager.findOne).toHaveBeenCalledExactlyOnceWith(
        equipoRefrigeracionSchema,
        {
          where: { id: equipo.id, activo: true },
          lock: { mode: 'pessimistic_write' },
        },
      );
      expect(manager.insert).toHaveBeenCalledExactlyOnceWith(
        incidenteCadenaFrioSchema,
        incidente,
      );
    });

    it('omite la inserción si no encuentra el equipo activo', async () => {
      manager.findOne.mockResolvedValue(null);
      await expect(adapter.registrar(reporte, actor)).resolves.toBeNull();
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('propaga el fallo de inserción del incidente', async () => {
      const error = new Error('Inserción fallida');
      manager.insert.mockRejectedValue(error);
      await expect(adapter.registrar(reporte, actor)).rejects.toBe(error);
    });
  });
});
