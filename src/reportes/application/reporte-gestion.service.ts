import { Inject, Injectable } from '@nestjs/common';
import {
  REPORTE_GESTION_REPOSITORIO,
  type ReporteGestionRepositorio,
} from '../domain/reporte-gestion.js';

@Injectable()
export class ReporteGestionService {
  constructor(
    @Inject(REPORTE_GESTION_REPOSITORIO)
    private readonly repositorio: ReporteGestionRepositorio,
  ) {}

  consultar(periodo: string, usuarioId: string) {
    return this.repositorio.consultar(periodo, usuarioId);
  }
}
