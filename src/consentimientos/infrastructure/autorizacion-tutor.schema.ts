import { EntitySchema } from 'typeorm';
import {
  EstadoAutorizacionTutor,
  type AutorizacionTutor,
} from '../domain/autorizacion-tutor.js';

export const autorizacionTutorSchema = new EntitySchema<
  AutorizacionTutor & { soporte: Buffer }
>({
  name: 'AutorizacionTutor',
  tableName: 'autorizaciones_tutor',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    beneficiarioId: { type: 'varchar', length: 36 },
    nombreTutor: { type: 'varchar', length: 150 },
    tipoDocumentoTutor: { type: 'varchar', length: 10 },
    numeroDocumentoTutor: { type: 'varchar', length: 30 },
    parentesco: { type: 'varchar', length: 20 },
    telefonoTutor: { type: 'varchar', length: 20 },
    estado: { type: 'enum', enum: EstadoAutorizacionTutor },
    aprobadaPorId: { type: 'varchar', length: 36 },
    fechaAprobacion: { type: 'datetime', precision: 3 },
    soporte: { type: 'mediumblob', select: false },
    soporteTipoMime: { type: 'varchar', length: 50 },
    soporteTamanoBytes: { type: 'int', unsigned: true },
    revocadaPorId: { type: 'varchar', length: 36, nullable: true },
    fechaRevocacion: { type: 'datetime', precision: 3, nullable: true },
    motivoRevocacion: { type: 'varchar', length: 255, nullable: true },
  },
});
