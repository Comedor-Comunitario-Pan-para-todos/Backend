import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EstadoLoteEnum,
  LoteInventarioModel,
  type UnidadMedidaInsumoEnum,
} from '../../../../domain/models/lote-inventario.model.js';
import type {
  FiltrosConsultaInventario,
  InventarioRepositoryPort,
  ResultadoPaginadoInventario,
} from '../../../../domain/ports/inventario-repository.port.js';
import { LoteInventarioEntity } from './lote-inventario.entity.js';

@Injectable()
export class InventarioTypeOrmAdapter implements InventarioRepositoryPort {
  constructor(
    @InjectRepository(LoteInventarioEntity)
    private readonly repo: Repository<LoteInventarioEntity>,
  ) {}

  async save(lote: LoteInventarioModel): Promise<LoteInventarioModel> {
    const entity = this.repo.create({
      id: lote.id,
      codigoLote: lote.codigoLote,
      nombreInsumo: lote.nombreInsumo,
      categoria: lote.categoria,
      cantidadInicial: lote.cantidadInicial,
      cantidadActual: lote.cantidadActual,
      unidadMedida: lote.unidadMedida,
      fechaRecepcion: lote.fechaRecepcion,
      fechaVencimiento: lote.fechaVencimiento,
      estado: lote.estado,
      donacionOrigenId: lote.donacionOrigenId ?? null,
      nombreDonante: lote.nombreDonante ?? null,
      observaciones: lote.observaciones ?? null,
      registradoPorId: lote.registradoPorId ?? null,
    });

    const guardado = await this.repo.save(entity);
    return this.toDomain(guardado);
  }

  async findById(id: string): Promise<LoteInventarioModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCodigoLote(codigoLote: string): Promise<LoteInventarioModel | null> {
    const entity = await this.repo.findOne({ where: { codigoLote } });
    return entity ? this.toDomain(entity) : null;
  }

  async generarSiguienteCodigoLote(nombreInsumo: string, fechaRecepcion: Date): Promise<string> {
    const year = fechaRecepcion.getFullYear();
    const slugInsumo = nombreInsumo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4) || 'INSU';

    const patron = `LOT-${year}-${slugInsumo}-%`;
    const conteo = await this.repo
      .createQueryBuilder('lote')
      .where('lote.codigoLote LIKE :patron', { patron })
      .getCount();

    const consecutivo = String(conteo + 1).padStart(4, '0');
    return `LOT-${year}-${slugInsumo}-${consecutivo}`;
  }

  async search(
    filtros: FiltrosConsultaInventario,
  ): Promise<ResultadoPaginadoInventario<LoteInventarioModel>> {
    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 10;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('lote');

    if (filtros.nombreInsumo) {
      qb.andWhere('LOWER(lote.nombreInsumo) LIKE LOWER(:nombre)', {
        nombre: `%${filtros.nombreInsumo}%`,
      });
    }

    if (filtros.categoria) {
      qb.andWhere('LOWER(lote.categoria) = LOWER(:cat)', {
        cat: filtros.categoria,
      });
    }

    if (filtros.estado) {
      qb.andWhere('lote.estado = :estado', {
        estado: filtros.estado,
      });
    }

    if (filtros.proximoAVencerDias) {
      const ahora = new Date();
      const limite = new Date();
      limite.setDate(ahora.getDate() + Number(filtros.proximoAVencerDias));
      qb.andWhere('lote.fechaVencimiento BETWEEN :ahora AND :limite', {
        ahora,
        limite,
      });
    }

    // Rotación de inventario FEFO: Primero en vencer, primero en salir
    qb.orderBy('lote.fechaVencimiento', 'ASC');
    qb.addOrderBy('lote.fechaRecepcion', 'ASC');

    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findDisponiblesPorInsumoOrdenadoPorVencimiento(
    nombreInsumo: string,
  ): Promise<LoteInventarioModel[]> {
    const entities = await this.repo
      .createQueryBuilder('lote')
      .where('LOWER(lote.nombreInsumo) = LOWER(:nombre)', { nombre: nombreInsumo.trim() })
      .andWhere('lote.estado = :estado', { estado: EstadoLoteEnum.DISPONIBLE })
      .andWhere('lote.cantidadActual > 0')
      .orderBy('lote.fechaVencimiento', 'ASC')
      .addOrderBy('lote.fechaRecepcion', 'ASC')
      .getMany();

    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(e: LoteInventarioEntity): LoteInventarioModel {
    return new LoteInventarioModel(
      e.id,
      e.codigoLote,
      e.nombreInsumo,
      e.categoria,
      Number(e.cantidadInicial),
      Number(e.cantidadActual),
      e.unidadMedida as UnidadMedidaInsumoEnum,
      new Date(e.fechaRecepcion),
      new Date(e.fechaVencimiento),
      e.estado,
      e.donacionOrigenId,
      e.nombreDonante,
      e.observaciones,
      e.registradoPorId ?? undefined,
      e.createdAt,
      e.updatedAt,
    );
  }
}
