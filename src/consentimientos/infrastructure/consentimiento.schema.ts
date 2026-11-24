import { EntitySchema } from 'typeorm';
import {
  MetodoConsentimiento,
  type ConsentimientoBeneficiario,
} from '../domain/consentimiento.js';

export interface ConsentimientoPersistido extends ConsentimientoBeneficiario {
  activaImagen?: boolean | null;
  revocadoPorId?: string | null;
  revocadoEn?: Date | null;
}

export const consentimientoBeneficiarioSchema =
  new EntitySchema<ConsentimientoPersistido>({
    name: 'ConsentimientoBeneficiario',
    tableName: 'consentimientos_beneficiarios',
    synchronize: false,
    // Los índices de unicidad por finalidad los administra la migración.
    columns: {
      activaImagen: { type: 'boolean', nullable: true },
      revocadoPorId: { type: 'varchar', length: 36, nullable: true },
      revocadoEn: { type: 'datetime', precision: 3, nullable: true },
      id: { type: 'varchar', length: 36, primary: true },
      beneficiarioId: { type: 'varchar', length: 36 },
      aceptado: { type: 'boolean' },
      versionTexto: { type: 'int' },
      finalidad: { type: 'varchar', length: 255 },
      metodo: { type: 'enum', enum: MetodoConsentimiento },
      registradoPorId: { type: 'varchar', length: 36 },
      registradoEn: { type: 'datetime', precision: 3 },
    },
  });
