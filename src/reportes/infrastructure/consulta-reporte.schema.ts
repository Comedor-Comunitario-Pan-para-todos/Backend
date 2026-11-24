import { EntitySchema } from 'typeorm';

export const consultaReporteSchema = new EntitySchema<{
  id: string;
  periodo: string;
  usuarioId: string;
  consultadoEn: Date;
}>({
  name: 'ConsultaReporteGestion',
  tableName: 'consultas_reportes_gestion',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    periodo: { type: 'varchar', length: 7 },
    usuarioId: { type: 'varchar', length: 36 },
    consultadoEn: { type: 'datetime', precision: 3 },
  },
});
