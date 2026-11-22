import type {
  EquipoRefrigeracion,
  IncidenteCadenaFrio,
  ReporteIncidente,
} from '../cadena-frio.js';

export const CADENA_FRIO_REPOSITORY = Symbol('CADENA_FRIO_REPOSITORY');

export interface CadenaFrioRepository {
  listarEquipos(usuarioId: string): Promise<EquipoRefrigeracion[]>;
  registrar(
    reporte: ReporteIncidente,
    usuarioId: string,
  ): Promise<IncidenteCadenaFrio | null>;
}
