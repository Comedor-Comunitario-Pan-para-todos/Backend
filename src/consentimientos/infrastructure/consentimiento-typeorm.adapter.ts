import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import type { ConsentimientoRepository } from '../domain/consentimiento-repository.port.js';
import {
  FINALIDAD_CONSENTIMIENTO,
  type ConsentimientoBeneficiario,
} from '../domain/consentimiento.js';
import { consentimientoBeneficiarioSchema } from './consentimiento.schema.js';

@Injectable()
export class ConsentimientoTypeOrmAdapter implements ConsentimientoRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async registrar(consentimiento: ConsentimientoBeneficiario) {
    const { beneficiarioId, finalidad, versionTexto } = consentimiento;
    const resultado = await this.dataSource.transaction(async (manager) => {
      const beneficiario = await manager.findOne(Beneficiario, {
        select: { id: true },
        where: { id: beneficiarioId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!beneficiario) return null;

      const existente = await manager.findOneBy(
        consentimientoBeneficiarioSchema,
        {
          beneficiarioId,
          finalidad,
          versionTexto,
        },
      );
      if (existente) return { creado: false, consentimiento: existente };

      await manager.insert(consentimientoBeneficiarioSchema, consentimiento);
      if (finalidad === FINALIDAD_CONSENTIMIENTO) {
        await manager.update(Beneficiario, beneficiarioId, {
          autorizaTratamientoDatos: true,
        });
      }
      return { creado: true, consentimiento };
    });
    if (!resultado) return null;

    const [evidencia] = await this.conOperadores([resultado.consentimiento]);
    return { creado: resultado.creado, consentimiento: evidencia };
  }

  async buscarVigentes(beneficiarioIds: string[]) {
    if (beneficiarioIds.length === 0) return [];

    const repository = this.dataSource.getRepository(
      consentimientoBeneficiarioSchema,
    );
    const vigentes = await repository
      .createQueryBuilder('actual')
      .where({
        beneficiarioId: In(beneficiarioIds),
        finalidad: FINALIDAD_CONSENTIMIENTO,
      })
      .andWhere((query) => {
        const posterior = query
          .subQuery()
          .select('1')
          .from(consentimientoBeneficiarioSchema, 'posterior')
          .where('posterior.beneficiarioId = actual.beneficiarioId')
          .andWhere('posterior.finalidad = actual.finalidad')
          .andWhere('posterior.versionTexto > actual.versionTexto')
          .getQuery();
        return 'NOT EXISTS ' + posterior;
      })
      .getMany();
    return this.conOperadores(vigentes);
  }

  private async conOperadores(consentimientos: ConsentimientoBeneficiario[]) {
    if (consentimientos.length === 0) return [];

    const ids = [
      ...new Set(consentimientos.map(({ registradoPorId }) => registradoPorId)),
    ];
    const usuarios = await this.dataSource.getRepository(Usuario).find({
      select: { id: true, nombreCompleto: true },
      where: { id: In(ids) },
      withDeleted: true,
    });
    const nombres = new Map(
      usuarios.map(({ id, nombreCompleto }) => [id, nombreCompleto]),
    );
    return consentimientos.map((consentimiento) => ({
      ...consentimiento,
      registradoPor: {
        id: consentimiento.registradoPorId,
        nombreCompleto: nombres.get(consentimiento.registradoPorId) ?? null,
      },
    }));
  }
}
