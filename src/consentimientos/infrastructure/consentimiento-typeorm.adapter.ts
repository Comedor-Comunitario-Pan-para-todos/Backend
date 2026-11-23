import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import type { ConsentimientoRepository } from '../domain/consentimiento-repository.port.js';
import type { ConsentimientoBeneficiario } from '../domain/consentimiento.js';
import { consentimientoBeneficiarioSchema } from './consentimiento.schema.js';

@Injectable()
export class ConsentimientoTypeOrmAdapter implements ConsentimientoRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  registrar(consentimiento: ConsentimientoBeneficiario) {
    const { beneficiarioId } = consentimiento;
    return this.dataSource.transaction(async (manager) => {
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
          finalidad: consentimiento.finalidad,
          versionTexto: consentimiento.versionTexto,
        },
      );
      if (existente) return { creado: false, consentimiento: existente };

      await manager.insert(consentimientoBeneficiarioSchema, consentimiento);
      await manager.update(Beneficiario, beneficiarioId, {
        autorizaTratamientoDatos: true,
      });
      return { creado: true, consentimiento };
    });
  }
}
