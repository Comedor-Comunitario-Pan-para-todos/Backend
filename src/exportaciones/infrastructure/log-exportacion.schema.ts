import { EntitySchema } from 'typeorm';

export const logExportacionSchema = new EntitySchema<{
  id: string;
  usuarioId: string;
  registradoEn: Date;
  total: number;
  desde: string | null;
  hasta: string | null;
}>({
  name: 'LogExportacion',
  tableName: 'log_exportaciones_beneficiarios',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    usuarioId: { type: 'varchar', length: 36 },
    registradoEn: { type: 'datetime', precision: 3 },
    total: { type: 'int', unsigned: true },
    desde: { type: 'date', nullable: true },
    hasta: { type: 'date', nullable: true },
  },
});
