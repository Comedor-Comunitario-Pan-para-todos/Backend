import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ActaDescarte } from '../../actas-descarte/infrastructure/adapters/out/persistence/acta-descarte.entity.js';
import { EstadoActaEnum } from '../../actas-descarte/dto/crear-acta-descarte.dto.js';
import { Descarte } from '../../descartes/infrastructure/adapters/out/persistence/descarte.entity.js';
import type {
  ReporteGestion,
  ReporteGestionRepositorio,
} from '../domain/reporte-gestion.js';
import { AsistenciaDiariaView } from './asistencia-diaria.view.js';
import { consultaReporteSchema } from './consulta-reporte.schema.js';

@Injectable()
export class ReporteGestionTypeOrmAdapter implements ReporteGestionRepositorio {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  consultar(periodo: string, usuarioId: string): Promise<ReporteGestion> {
    const inicioDia = periodo + '-01';
    const inicio = new Date(inicioDia + 'T00:00:00-05:00');
    const fin = new Date(inicio);
    fin.setUTCMonth(fin.getUTCMonth() + 1);
    const finDia = fin.toISOString().slice(0, 10);

    return this.db.transaction(async (manager) => {
      const filas = await manager
        .createQueryBuilder(AsistenciaDiariaView, 'asistencia')
        .select('CAST(asistencia.fecha AS CHAR)', 'fecha')
        .addSelect('asistencia.turnosEmitidos', 'turnosEmitidos')
        .addSelect('asistencia.turnosAtendidos', 'turnosAtendidos')
        .where(
          'asistencia.fecha >= :inicioDia AND asistencia.fecha < :finDia',
          { inicioDia, finDia },
        )
        .orderBy('asistencia.fecha', 'ASC')
        .getRawMany<AsistenciaDiariaView>();

      // La unidad es texto libre en RF-05; solo una lista cerrada puede salir del reporte.
      const unidad = `CASE UPPER(TRIM(descarte.unidadMedida))
        WHEN 'KG' THEN 'KG' WHEN 'G' THEN 'G' WHEN 'L' THEN 'L'
        WHEN 'ML' THEN 'ML' WHEN 'UNIDAD' THEN 'UNIDAD' WHEN 'UNIDADES' THEN 'UNIDAD'
        ELSE NULL END`;
      const descartes = await manager
        .createQueryBuilder(Descarte, 'descarte')
        .select(unidad, 'unidadMedida')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(descarte.cantidad)', 'cantidad')
        .where('descarte.fecha >= :inicio AND descarte.fecha < :fin', {
          inicio,
          fin,
        })
        .groupBy(unidad)
        .orderBy('unidadMedida', 'ASC')
        .getRawMany<{
          unidadMedida: string | null;
          cantidad: string;
          total: string;
        }>();

      const actasAutorizadas = await manager
        .createQueryBuilder(ActaDescarte, 'acta')
        .where(
          'acta.estado = :estado AND acta.fechaAutorizacion >= :inicio AND acta.fechaAutorizacion < :fin',
          { estado: EstadoActaEnum.AUTORIZADA, inicio, fin },
        )
        .getCount();

      const asistenciaDiaria = filas.map(
        ({ fecha, turnosEmitidos, turnosAtendidos }) => ({
          fecha,
          turnosEmitidos: Number(turnosEmitidos),
          turnosAtendidos: Number(turnosAtendidos),
        }),
      );
      await manager.insert(consultaReporteSchema, {
        id: randomUUID(),
        periodo,
        usuarioId,
        consultadoEn: new Date(),
      });
      return {
        periodo,
        turnosEmitidos: asistenciaDiaria.reduce(
          (total, dia) => total + dia.turnosEmitidos,
          0,
        ),
        turnosAtendidos: asistenciaDiaria.reduce(
          (total, dia) => total + dia.turnosAtendidos,
          0,
        ),
        diasAtencion: asistenciaDiaria.filter((dia) => dia.turnosAtendidos > 0)
          .length,
        descartesRegistrados: descartes.reduce(
          (total, grupo) => total + Number(grupo.total),
          0,
        ),
        actasAutorizadas,
        asistenciaDiaria,
        descartesPorUnidad: descartes.flatMap(({ unidadMedida, cantidad }) =>
          unidadMedida ? [{ unidadMedida, cantidad: Number(cantidad) }] : [],
        ),
        fotos: [],
      };
    });
  }
}
