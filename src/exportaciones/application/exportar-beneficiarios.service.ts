import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EXPORTACIONES_REPOSITORIO,
  GENERADOR_EXCEL,
  type ExportacionesRepositorio,
  type FiltrosExportacion,
  type GeneradorExcel,
} from '../domain/exportaciones.js';

@Injectable()
export class ExportarBeneficiariosService {
  constructor(
    @Inject(EXPORTACIONES_REPOSITORIO)
    private readonly repositorio: ExportacionesRepositorio,
    @Inject(GENERADOR_EXCEL) private readonly excel: GeneradorExcel,
  ) {}

  async ejecutar(filtros: FiltrosExportacion, usuarioId: string) {
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      throw new BadRequestException('desde debe ser anterior o igual a hasta');
    }
    const filas = await this.repositorio.buscarBeneficiarios(filtros);
    const archivo = await this.excel.generar(filas);
    await this.repositorio.auditar(usuarioId, filas.length, filtros);
    return archivo;
  }
}
