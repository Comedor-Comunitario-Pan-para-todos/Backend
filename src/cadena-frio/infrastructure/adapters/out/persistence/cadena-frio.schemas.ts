import { EntitySchema } from 'typeorm';
import {
  TipoEquipoRefrigeracion,
  type EquipoRefrigeracion,
  type IncidenteCadenaFrio,
} from '../../../../domain/cadena-frio.js';

export const equipoRefrigeracionSchema = new EntitySchema<EquipoRefrigeracion>({
  name: 'EquipoRefrigeracion',
  tableName: 'equipos_refrigeracion',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    nombre: { type: 'varchar', length: 120 },
    tipo: { type: 'enum', enum: TipoEquipoRefrigeracion },
    activo: { type: 'boolean', default: true },
  },
});

export const incidenteCadenaFrioSchema = new EntitySchema<IncidenteCadenaFrio>({
  name: 'IncidenteCadenaFrio',
  tableName: 'incidentes_cadena_frio',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    equipoId: { type: 'varchar', length: 36 },
    temperaturaObservada: { type: 'double' },
    minutosTranscurridos: { type: 'int' },
    insumosAfectados: { type: 'json' },
    accionCorrectiva: { type: 'varchar', length: 1000 },
    reportadoPorId: { type: 'varchar', length: 36 },
    registradoEn: { type: 'datetime', precision: 3 },
  },
});

export const accesoCatalogoSchema = new EntitySchema<{
  id: string;
  usuarioId: string;
  consultadoEn: Date;
}>({
  name: 'AccesoCatalogoFrio',
  tableName: 'accesos_catalogo_frio',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    usuarioId: { type: 'varchar', length: 36 },
    consultadoEn: { type: 'datetime', precision: 3 },
  },
});
