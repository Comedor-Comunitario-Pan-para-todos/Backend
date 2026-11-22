export enum TipoEquipoRefrigeracion {
  NEVERA = 'NEVERA',
  CONGELADOR = 'CONGELADOR',
}

export interface EquipoRefrigeracion {
  id: string;
  nombre: string;
  tipo: TipoEquipoRefrigeracion;
  activo: boolean;
}

export interface ReporteIncidente {
  equipoId: string;
  temperaturaObservada: number;
  minutosTranscurridos: number;
  insumosAfectados: string[];
  accionCorrectiva: string;
}

export interface IncidenteCadenaFrio extends ReporteIncidente {
  id: string;
  reportadoPorId: string;
  registradoEn: Date;
}
