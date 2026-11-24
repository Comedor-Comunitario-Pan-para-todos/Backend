import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LoteInventarioModel } from '../../domain/models/lote-inventario.model.js';
import {
  INVENTARIO_REPOSITORY_PORT,
  type InventarioRepositoryPort,
} from '../../domain/ports/inventario-repository.port.js';
import type { RegistrarConsumoInsumoDto } from '../../dto/crear-lote-inventario.dto.js';

@Injectable()
export class RegistrarConsumoInsumoUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY_PORT)
    private readonly inventarioRepository: InventarioRepositoryPort,
  ) {}

  async execute(
    loteId: string,
    dto: RegistrarConsumoInsumoDto,
  ): Promise<LoteInventarioModel> {
    const lote = await this.inventarioRepository.findById(loteId);
    if (!lote) {
      throw new NotFoundException(`Lote con ID "${loteId}" no encontrado`);
    }

    try {
      lote.descontarStock(dto.cantidad);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    return this.inventarioRepository.save(lote);
  }
}
