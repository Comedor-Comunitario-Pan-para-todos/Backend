import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EstadoLoteEnum,
  LoteInventarioModel,
} from '../../domain/models/lote-inventario.model.js';
import {
  INVENTARIO_REPOSITORY_PORT,
  type InventarioRepositoryPort,
} from '../../domain/ports/inventario-repository.port.js';
import type { CrearLoteInventarioDto } from '../../dto/crear-lote-inventario.dto.js';

@Injectable()
export class RegistrarLoteInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY_PORT)
    private readonly inventarioRepository: InventarioRepositoryPort,
  ) {}

  async execute(
    dto: CrearLoteInventarioDto,
    usuarioId: string,
  ): Promise<LoteInventarioModel> {
    const fechaRecepcion = new Date(dto.fechaRecepcion);
    const fechaVencimiento = new Date(dto.fechaVencimiento);

    if (isNaN(fechaRecepcion.getTime())) {
      throw new BadRequestException('La fecha de recepción es obligatoria y debe ser válida');
    }

    if (isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('La fecha de vencimiento es obligatoria y debe ser válida');
    }

    // Regla de Negocio (RF-08 Criterios): La fecha de vencimiento no puede ser igual o anterior a la de recepción
    if (fechaVencimiento.getTime() <= fechaRecepcion.getTime()) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de recepción',
      );
    }

    let codigoLote = dto.codigoLote?.trim();
    if (codigoLote) {
      const existeCodigo = await this.inventarioRepository.findByCodigoLote(codigoLote);
      if (existeCodigo) {
        throw new ConflictException(`Ya existe un lote registrado con el código "${codigoLote}"`);
      }
    } else {
      codigoLote = await this.inventarioRepository.generarSiguienteCodigoLote(
        dto.nombreInsumo,
        fechaRecepcion,
      );
    }

    const nuevoLote = new LoteInventarioModel(
      randomUUID(),
      codigoLote,
      dto.nombreInsumo.trim(),
      dto.categoria.trim(),
      dto.cantidadInicial,
      dto.cantidadInicial,
      dto.unidadMedida,
      fechaRecepcion,
      fechaVencimiento,
      EstadoLoteEnum.DISPONIBLE,
      dto.donacionOrigenId?.trim() ?? null,
      dto.nombreDonante?.trim() ?? null,
      dto.observaciones?.trim() ?? null,
      usuarioId,
      new Date(),
      new Date(),
    );

    nuevoLote.actualizarEstadoSegunStockYFecha();

    return this.inventarioRepository.save(nuevoLote);
  }
}
