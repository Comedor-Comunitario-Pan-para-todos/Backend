import { EntitySchema } from 'typeorm';
import {
  EventoRetencion,
  type BitacoraRetencion,
  type PoliticaRetencion,
} from '../domain/retencion.js';

export const politicaRetencionSchema = new EntitySchema<
  { id: number } & {
    [K in keyof PoliticaRetencion]: PoliticaRetencion[K] | null;
  }
>({
  name: 'PoliticaRetencion',
  tableName: 'politica_retencion',
  synchronize: false,
  columns: {
    id: { type: 'tinyint', primary: true },
    diasBasicos: { type: 'int', nullable: true },
    diasSensibles: { type: 'int', nullable: true },
    actualizadaPorId: { type: 'varchar', length: 36, nullable: true },
    actualizadaEn: { type: 'datetime', precision: 3, nullable: true },
  },
});

export const bitacoraRetencionSchema = new EntitySchema<BitacoraRetencion>({
  name: 'BitacoraRetencion',
  tableName: 'bitacora_retencion',
  synchronize: false,
  columns: {
    id: { type: 'varchar', length: 36, primary: true },
    evento: { type: 'enum', enum: EventoRetencion },
    operadorId: { type: 'varchar', length: 36, nullable: true },
    registradoEn: { type: 'datetime', precision: 3 },
    anterior: { type: 'simple-json', nullable: true },
    vigente: { type: 'simple-json', nullable: true },
    basicosPendientes: { type: 'int', nullable: true },
    sensiblesPendientes: { type: 'int', nullable: true },
  },
});
