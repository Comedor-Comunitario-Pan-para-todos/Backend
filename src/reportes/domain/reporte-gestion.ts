export interface AsistenciaDiaria {
  fecha: string;
  turnosEmitidos: number;
  turnosAtendidos: number;
}

export interface DescartePorUnidad {
  unidadMedida: string;
  cantidad: number;
}

export interface ReporteGestion {
  periodo: string;
  turnosEmitidos: number;
  turnosAtendidos: number;
  diasAtencion: number;
  descartesRegistrados: number;
  actasAutorizadas: number;
  asistenciaDiaria: AsistenciaDiaria[];
  descartesPorUnidad: DescartePorUnidad[];
  fotos: [];
}

export interface ReporteGestionRepositorio {
  consultar(periodo: string, usuarioId: string): Promise<ReporteGestion>;
}

export const REPORTE_GESTION_REPOSITORIO = Symbol(
  'REPORTE_GESTION_REPOSITORIO',
);
