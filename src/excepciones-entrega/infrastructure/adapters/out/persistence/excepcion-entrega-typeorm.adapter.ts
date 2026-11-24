import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcepcionEntrega } from '../../../../entities/excepcion-entrega.entity.js';
import {
  ExcepcionEntregaRepositoryPort,
  ExcepcionPaginatedResult,
  ExcepcionPaginationOptions,
} from '../../../../domain/ports/excepcion-entrega-repository.port.js';
import { ExcepcionEntregaModel } from '../../../../domain/models/excepcion-entrega.model.js';

@Injectable()
export class ExcepcionEntregaTypeOrmAdapter implements ExcepcionEntregaRepositoryPort {
  constructor(
    @InjectRepository(ExcepcionEntrega)
    private readonly repo: Repository<ExcepcionEntrega>,
  ) {}

  async save(data: Partial<ExcepcionEntregaModel>): Promise<ExcepcionEntregaModel> {
    const entity = this.repo.create({
      id: data.id,
      turnoId: data.turnoId,
      autorizadoPorUsuarioId: data.autorizadoPorUsuarioId,
      tipoExcepcion: data.tipoExcepcion,
      justificacion: data.justificacion,
      cantidadRaciones: data.cantidadRaciones,
      fechaHora: data.fechaHora,
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<ExcepcionEntregaModel | null> {
    const found = await this.repo.findOne({
      where: { id },
      relations: {
        turno: {
          beneficiario: true,
        },
        autorizadoPorUsuario: true,
      },
    });

    return found ? this.toDomain(found) : null;
  }

  async findByTurnoId(turnoId: string): Promise<ExcepcionEntregaModel | null> {
    const found = await this.repo.findOne({
      where: { turnoId },
      relations: {
        turno: {
          beneficiario: true,
        },
        autorizadoPorUsuario: true,
      },
    });

    return found ? this.toDomain(found) : null;
  }

  async findAll(options: ExcepcionPaginationOptions): Promise<ExcepcionPaginatedResult> {
    const query = this.repo
      .createQueryBuilder('excepcion')
      .leftJoinAndSelect('excepcion.turno', 'turno')
      .leftJoinAndSelect('turno.beneficiario', 'beneficiario')
      .leftJoinAndSelect('excepcion.autorizadoPorUsuario', 'autorizadoPor');

    if (options.tipoExcepcion) {
      query.andWhere('excepcion.tipoExcepcion = :tipo', { tipo: options.tipoExcepcion });
    }

    if (options.turnoId) {
      query.andWhere('excepcion.turnoId = :turnoId', { turnoId: options.turnoId });
    }

    if (options.desde) {
      query.andWhere('excepcion.fechaHora >= :desde', { desde: options.desde });
    }

    if (options.hasta) {
      query.andWhere('excepcion.fechaHora <= :hasta', { hasta: options.hasta });
    }

    query.orderBy('excepcion.fechaHora', 'DESC');

    const total = await query.getCount();
    const data = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getMany();

    return {
      data: data.map((item) => this.toDomain(item)),
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit) || 1,
      },
    };
  }

  private toDomain(entity: ExcepcionEntrega): ExcepcionEntregaModel {
    const model = new ExcepcionEntregaModel();
    model.id = entity.id;
    model.turnoId = entity.turnoId;
    model.autorizadoPorUsuarioId = entity.autorizadoPorUsuarioId;
    model.tipoExcepcion = entity.tipoExcepcion;
    model.justificacion = entity.justificacion;
    model.cantidadRaciones = entity.cantidadRaciones;
    model.fechaHora = entity.fechaHora;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;

    if (entity.turno) {
      model.turno = {
        id: entity.turno.id,
        fecha: entity.turno.fecha,
        numeroTurno: entity.turno.numeroTurno,
        beneficiarioId: entity.turno.beneficiarioId,
        beneficiario: entity.turno.beneficiario
          ? {
              id: entity.turno.beneficiario.id,
              nombres: entity.turno.beneficiario.nombres,
              apellidos: entity.turno.beneficiario.apellidos,
              numeroDocumento: entity.turno.beneficiario.numeroDocumento,
            }
          : undefined,
      };
    }

    if (entity.autorizadoPorUsuario) {
      model.autorizadoPorUsuario = {
        id: entity.autorizadoPorUsuario.id,
        nombreCompleto: entity.autorizadoPorUsuario.nombreCompleto,
        email: entity.autorizadoPorUsuario.email,
      };
    }

    return model;
  }
}
