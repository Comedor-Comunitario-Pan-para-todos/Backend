export interface PlazosRetencion {
  diasBasicos: number;
  diasSensibles: number;
}

export interface PoliticaRetencion extends PlazosRetencion {
  actualizadaPorId: string;
  actualizadaEn: Date;
}

export enum EventoRetencion {
  CONSULTA = 'CONSULTA',
  CAMBIO_POLITICA = 'CAMBIO_POLITICA',
  VERIFICACION = 'VERIFICACION',
}

export interface BitacoraRetencion {
  id: string;
  evento: EventoRetencion;
  operadorId: string | null;
  registradoEn: Date;
  anterior: PlazosRetencion | null;
  vigente: PlazosRetencion | null;
  basicosPendientes: number | null;
  sensiblesPendientes: number | null;
}

export interface RetencionRepositorio {
  consultar(
    actorId: string,
  ): Promise<{
    politica: PoliticaRetencion | null;
    historial: BitacoraRetencion[];
  }>;
  actualizar(
    plazos: PlazosRetencion,
    actorId: string,
    password: string,
  ): Promise<PoliticaRetencion | null>;
  verificar(ahora: Date): Promise<void>;
}

export const RETENCION_REPOSITORIO = Symbol('RETENCION_REPOSITORIO');
