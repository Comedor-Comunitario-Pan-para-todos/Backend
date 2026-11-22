import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoTurnoEnum } from '../../../../enums/estado-turno.enum.js';
import { TurnoModel } from '../../../../domain/models/turno.model.js';
import {
  TurnoPaginationOptions,
  TurnoPaginatedResult,
  TurnoRepositoryPort,
} from '../../../../domain/ports/turno-repository.port.js';
import { TurnoAtencion } from '../../../../entities/turno-atencion.entity.js';

@Injectable()
export class TurnoTypeOrmAdapter implements TurnoRepositoryPort {
  constructor(
    @InjectRepository(TurnoAtencion)
    private readonly repo: Repository<TurnoAtencion>,
  ) {}

  private toModel(t: TurnoAtencion): TurnoModel {
    return new TurnoModel(
      t.id,
      t.fecha,
      t.numeroTurno,
      t.beneficiarioId,
      t.emitidoPorUsuarioId,
      t.horaLlegada,
      t.estado,
      t.horaAtencion,
      t.motivoCancelacion,
      t.createdAt,
      t.updatedAt,
      t.beneficiario
        ? {
            id: t.beneficiario.id,
            nombres: t.beneficiario.nombres,
            apellidos: t.beneficiario.apellidos,
            numeroDocumento: t.beneficiario.numeroDocumento,
            tipoDocumento: t.beneficiario.tipoDocumento,
          }
        : undefined,
      t.emitidoPorUsuario
        ? {
            id: t.emitidoPorUsuario.id,
            nombreCompleto: t.emitidoPorUsuario.nombreCompleto,
            email: t.emitidoPorUsuario.email,
          }
        : undefined,
    );
  }

  async save(data: Partial<TurnoModel>): Promise<TurnoModel> {
    const entidad = this.repo.create(data as Partial<TurnoAtencion>);
    const guardado = await this.repo.save(entidad);
    const completo = await this.findById(guardado.id);
    return completo ?? this.toModel(guardado);
  }

  async obtenerSiguienteNumeroTurno(fecha: string): Promise<number> {
    const resultado = await this.repo
      .createQueryBuilder('turno')
      .select('MAX(turno.numeroTurno)', 'max')
      .where('turno.fecha = :fecha', { fecha })
      .getRawOne();

    const max = resultado?.max ? parseInt(resultado.max, 10) : 0;
    return max + 1;
  }

  async findByBeneficiarioYFecha(
    beneficiarioId: string,
    fecha: string,
  ): Promise<TurnoModel | null> {
    const turno = await this.repo.findOne({
      where: { beneficiarioId, fecha },
      relations: { beneficiario: true, emitidoPorUsuario: true },
    });

    return turno ? this.toModel(turno) : null;
  }

  async findById(id: string): Promise<TurnoModel | null> {
    const turno = await this.repo.findOne({
      where: { id },
      relations: { beneficiario: true, emitidoPorUsuario: true },
    });

    return turno ? this.toModel(turno) : null;
  }

  async findAll(options: TurnoPaginationOptions): Promise<TurnoPaginatedResult> {
    const { fecha, estado, page, limit } = options;
    const qb = this.repo
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.beneficiario', 'beneficiario')
      .leftJoinAndSelect('turno.emitidoPorUsuario', 'emitidoPorUsuario');

    if (fecha) {
      qb.andWhere('turno.fecha = :fecha', { fecha });
    }

    if (estado) {
      qb.andWhere('turno.estado = :estado', { estado });
    }

    qb.orderBy('turno.numeroTurno', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((t) => this.toModel(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEstado(
    id: string,
    estado: EstadoTurnoEnum,
    extra?: { horaAtencion?: string; motivoCancelacion?: string },
  ): Promise<TurnoModel> {
    const updates: Partial<TurnoAtencion> = { estado };

    if (extra?.horaAtencion) {
      updates.horaAtencion = extra.horaAtencion;
    }
    if (extra?.motivoCancelacion !== undefined) {
      updates.motivoCancelacion = extra.motivoCancelacion;
    }

    await this.repo.update(id, updates);
    const turno = await this.findById(id);
    return turno!;
  }
}
