import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LoteInventarioModel } from '../../domain/models/lote-inventario.model.js';
import {
  INVENTARIO_REPOSITORY_PORT,
  type FiltrosConsultaInventario,
  type InventarioRepositoryPort,
  type ResultadoPaginadoInventario,
} from '../../domain/ports/inventario-repository.port.js';

@Injectable()
export class ConsultarInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY_PORT)
    private readonly inventarioRepository: InventarioRepositoryPort,
  ) {}

  async consultar(
    filtros: FiltrosConsultaInventario,
  ): Promise<ResultadoPaginadoInventario<LoteInventarioModel>> {
    return this.inventarioRepository.search(filtros);
  }

  async consultarPorId(id: string): Promise<LoteInventarioModel> {
    const lote = await this.inventarioRepository.findById(id);
    if (!lote) {
      throw new NotFoundException(`No se encontró el lote de inventario con ID "${id}"`);
    }
    return lote;
  }

  async consultarLotesDisponiblesParaConsumo(nombreInsumo: string): Promise<LoteInventarioModel[]> {
    return this.inventarioRepository.findDisponiblesPorInsumoOrdenadoPorVencimiento(nombreInsumo);
  }
}
