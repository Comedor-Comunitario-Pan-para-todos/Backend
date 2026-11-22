import { Inject, Injectable } from '@nestjs/common';
import type { ReporteIncidente } from '../domain/cadena-frio.js';
import {
  CADENA_FRIO_REPOSITORY,
  type CadenaFrioRepository,
} from '../domain/ports/cadena-frio-repository.port.js';

export class EquipoNoDisponibleError extends Error {}

@Injectable()
export class CadenaFrioService {
  constructor(
    @Inject(CADENA_FRIO_REPOSITORY)
    private readonly repository: CadenaFrioRepository,
  ) {}

  listarEquipos(usuarioId: string) {
    return this.repository.listarEquipos(usuarioId);
  }

  async registrar(reporte: ReporteIncidente, usuarioId: string) {
    const incidente = await this.repository.registrar(reporte, usuarioId);
    if (!incidente) {
      throw new EquipoNoDisponibleError(
        'El equipo de refrigeración no existe o está inactivo',
      );
    }
    return incidente;
  }
}
