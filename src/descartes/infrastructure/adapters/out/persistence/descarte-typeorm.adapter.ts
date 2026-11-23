import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DescarteModel } from '../../../../domain/models/descarte.model.js';
import {
  DescartePaginatedResult,
  DescartePaginationOptions,
  DescarteRepositoryPort,
} from '../../../../domain/ports/descarte-repository.port.js';
import { Descarte } from './descarte.entity.js';

@Injectable()
export class DescarteTypeOrmAdapter implements DescarteRepositoryPort {
  constructor(
    @InjectRepository(Descarte)
    private readonly repo: Repository<Descarte>,
  ) {}

  private toModel(d: Descarte): DescarteModel {
    return new DescarteModel(
      d.id,
      d.alimento,
      Number(d.cantidad),
      d.unidadMedida,
      d.motivo,
      d.fecha,
      d.evaluadoPor,
      d.autorizadoPorId,
      d.loteId,
      d.createdAt,
      d.updatedAt,
    );
  }

  async save(data: Partial<DescarteModel>): Promise<DescarteModel> {
    const entidad = this.repo.create({
      id: data.id,
      alimento: data.alimento,
      cantidad: data.cantidad,
      unidadMedida: data.unidadMedida,
      motivo: data.motivo,
      fecha: data.fecha,
      evaluadoPor: data.evaluadoPor,
      autorizadoPorId: data.autorizadoPorId,
      loteId: data.loteId,
    });

    const guardado = await this.repo.save(entidad);
    return this.toModel(guardado);
  }

  async findById(id: string): Promise<DescarteModel | null> {
    const entidad = await this.repo.findOne({ where: { id } });
    return entidad ? this.toModel(entidad) : null;
  }

  async search(options: DescartePaginationOptions): Promise<DescartePaginatedResult> {
    const { page, limit, busqueda, desde, hasta } = options;
    const qb = this.repo.createQueryBuilder('descarte');

    if (busqueda) {
      qb.andWhere(
        '(LOWER(descarte.alimento) LIKE :busqueda OR LOWER(descarte.motivo) LIKE :busqueda)',
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    if (desde) {
      qb.andWhere('descarte.fecha >= :desde', { desde });
    }

    if (hasta) {
      qb.andWhere('descarte.fecha <= :hasta', { hasta });
    }

    qb.orderBy('descarte.fecha', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [datos, total] = await qb.getManyAndCount();

    return {
      data: datos.map((item) => this.toModel(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
