import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ReporteIncidente } from '../../../../domain/cadena-frio.js';
import type { CadenaFrioRepository } from '../../../../domain/ports/cadena-frio-repository.port.js';
import {
  accesoCatalogoSchema,
  equipoRefrigeracionSchema,
  incidenteCadenaFrioSchema,
} from './cadena-frio.schemas.js';

@Injectable()
export class CadenaFrioTypeOrmAdapter implements CadenaFrioRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  listarEquipos(usuarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const equipos = await manager.find(equipoRefrigeracionSchema, {
        order: { nombre: 'ASC', id: 'ASC' },
      });
      await manager.insert(accesoCatalogoSchema, {
        id: randomUUID(),
        usuarioId,
        consultadoEn: new Date(),
      });
      return equipos;
    });
  }

  registrar(reporte: ReporteIncidente, usuarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const equipo = await manager.findOne(equipoRefrigeracionSchema, {
        where: { id: reporte.equipoId, activo: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!equipo) {
        return null;
      }

      const incidente = {
        ...reporte,
        id: randomUUID(),
        reportadoPorId: usuarioId,
        registradoEn: new Date(),
      };
      await manager.insert(incidenteCadenaFrioSchema, incidente);
      return incidente;
    });
  }
}
