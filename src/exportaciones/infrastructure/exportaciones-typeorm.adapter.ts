import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { FINALIDAD_REPORTE_ALCALDIA } from '../../consentimientos/domain/consentimiento.js';
import { consentimientoBeneficiarioSchema } from '../../consentimientos/infrastructure/consentimiento.schema.js';
import type {
  ExportacionesRepositorio,
  FilaBeneficiario,
  FiltrosExportacion,
} from '../domain/exportaciones.js';
import { logExportacionSchema } from './log-exportacion.schema.js';

@Injectable()
export class ExportacionesTypeOrmAdapter implements ExportacionesRepositorio {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  buscarBeneficiarios({ desde, hasta }: FiltrosExportacion) {
    const query = this.db
      .getRepository(Beneficiario)
      .createQueryBuilder('ficha');
    const consentimiento = query
      .subQuery()
      .select('1')
      .from(consentimientoBeneficiarioSchema, 'consentimiento')
      .where('consentimiento.beneficiarioId = ficha.id')
      .andWhere('consentimiento.finalidad = :finalidad')
      .andWhere(
        'consentimiento.aceptado = true AND consentimiento.revocadoEn IS NULL',
      );
    if (desde)
      consentimiento.andWhere('consentimiento.registradoEn >= :desde', {
        desde: new Date(desde + 'T00:00:00-05:00'),
      });
    if (hasta) {
      const fin = new Date(hasta + 'T00:00:00-05:00');
      fin.setUTCDate(fin.getUTCDate() + 1);
      consentimiento.andWhere('consentimiento.registradoEn < :fin', { fin });
    }
    return query
      .select('ficha.nombres', 'nombres')
      .addSelect('ficha.apellidos', 'apellidos')
      .where('EXISTS ' + consentimiento.getQuery())
      .setParameters({
        ...consentimiento.getParameters(),
        finalidad: FINALIDAD_REPORTE_ALCALDIA,
      })
      .orderBy('ficha.apellidos', 'ASC')
      .addOrderBy('ficha.nombres', 'ASC')
      .addOrderBy('ficha.id', 'ASC')
      .getRawMany<FilaBeneficiario>();
  }

  async auditar(usuarioId: string, total: number, filtros: FiltrosExportacion) {
    await this.db.manager.insert(logExportacionSchema, {
      id: randomUUID(),
      usuarioId,
      total,
      registradoEn: new Date(),
      desde: filtros.desde ?? null,
      hasta: filtros.hasta ?? null,
    });
  }
}
