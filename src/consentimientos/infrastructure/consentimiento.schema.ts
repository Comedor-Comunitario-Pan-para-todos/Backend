import { EntitySchema } from 'typeorm';
import {
  MetodoConsentimiento,
  type ConsentimientoBeneficiario,
} from '../domain/consentimiento.js';

export const consentimientoBeneficiarioSchema =
  new EntitySchema<ConsentimientoBeneficiario>({
    name: 'ConsentimientoBeneficiario',
    tableName: 'consentimientos_beneficiarios',
    synchronize: false,
    uniques: [{ columns: ['beneficiarioId', 'finalidad', 'versionTexto'] }],
    columns: {
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
