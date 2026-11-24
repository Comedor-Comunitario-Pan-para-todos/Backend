import { ViewColumn, ViewEntity } from 'typeorm';
import { EstadoTurnoEnum } from '../../turnos/enums/estado-turno.enum.js';

@ViewEntity({
  name: 'reporte_asistencia_diaria',
  expression: `
    SELECT fecha,
      COUNT(*) AS turnosEmitidos,
      SUM(CASE WHEN estado = '${EstadoTurnoEnum.ATENDIDO}' THEN 1 ELSE 0 END) AS turnosAtendidos
    FROM turnos_atencion
    GROUP BY fecha
  `,
})
export class AsistenciaDiariaView {
  @ViewColumn() fecha: string;
  @ViewColumn() turnosEmitidos: number | string;
  @ViewColumn() turnosAtendidos: number | string;
}
