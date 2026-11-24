export interface FiltrosExportacion {
  desde?: string;
  hasta?: string;
}

export interface FilaBeneficiario {
  nombres: string;
  apellidos: string;
}

export interface ExportacionesRepositorio {
  buscarBeneficiarios(filtros: FiltrosExportacion): Promise<FilaBeneficiario[]>;
  auditar(
    usuarioId: string,
    total: number,
    filtros: FiltrosExportacion,
  ): Promise<void>;
}

export interface GeneradorExcel {
  generar(filas: FilaBeneficiario[]): Promise<Buffer>;
}

export const EXPORTACIONES_REPOSITORIO = Symbol('EXPORTACIONES_REPOSITORIO');
export const GENERADOR_EXCEL = Symbol('GENERADOR_EXCEL');
