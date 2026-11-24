import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActaDescarteModel,
  EvidenciaFotoModel,
} from '../../../../domain/models/acta-descarte.model.js';
import {
  ActaDescartePaginatedResult,
  ActaDescartePaginationOptions,
  ActaDescarteRepositoryPort,
} from '../../../../domain/ports/acta-descarte-repository.port.js';
import { ActaDescarte } from './acta-descarte.entity.js';

@Injectable()
export class ActaDescarteTypeOrmAdapter implements ActaDescarteRepositoryPort {
  constructor(
    @InjectRepository(ActaDescarte)
    private readonly repo: Repository<ActaDescarte>,
  ) {}

  private toModel(a: ActaDescarte): ActaDescarteModel {
    const evidencias = (a.evidencias ?? []).map(
      (e) => new EvidenciaFotoModel(e.id, e.url, e.mimeType, e.descripcion),
    );

    return new ActaDescarteModel(
      a.id,
      a.numeroActa,
      a.donacionOrigenId,
      a.insumo,
      Number(a.cantidad),
      a.unidadMedida,
      a.tipoDonante,
      a.motivo,
      a.estado,
      evidencias,
      a.generadaPorId,
      a.autorizadaPorId,
      a.fechaAutorizacion,
      a.observaciones,
      a.createdAt,
      a.updatedAt,
    );
  }

  async save(data: Partial<ActaDescarteModel>): Promise<ActaDescarteModel> {
    const evidenciasRaw = data.evidencias
      ? data.evidencias.map((e) => ({
          id: e.id,
          url: e.url,
          mimeType: e.mimeType,
          descripcion: e.descripcion,
        }))
      : undefined;

    const entidad = this.repo.create({
      id: data.id,
      numeroActa: data.numeroActa,
      donacionOrigenId: data.donacionOrigenId,
      insumo: data.insumo,
      cantidad: data.cantidad,
      unidadMedida: data.unidadMedida,
      tipoDonante: data.tipoDonante,
      motivo: data.motivo,
      estado: data.estado,
      evidencias: evidenciasRaw,
      generadaPorId: data.generadaPorId,
      autorizadaPorId: data.autorizadaPorId,
      fechaAutorizacion: data.fechaAutorizacion,
      observaciones: data.observaciones,
    });

    const guardada = await this.repo.save(entidad);
    return this.toModel(guardada);
  }

  async findById(id: string): Promise<ActaDescarteModel | null> {
    const acta = await this.repo.findOne({ where: { id } });
    return acta ? this.toModel(acta) : null;
  }

  async search(options: ActaDescartePaginationOptions): Promise<ActaDescartePaginatedResult> {
    const { page, limit, estado, tipoDonante, busqueda } = options;
    const qb = this.repo.createQueryBuilder('acta');

    if (estado) {
      qb.andWhere('acta.estado = :estado', { estado });
    }

    if (tipoDonante) {
      qb.andWhere('acta.tipoDonante = :tipoDonante', { tipoDonante });
    }

    if (busqueda) {
      qb.andWhere(
        '(LOWER(acta.numeroActa) LIKE :busqueda OR LOWER(acta.insumo) LIKE :busqueda OR LOWER(acta.donacionOrigenId) LIKE :busqueda)',
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    qb.orderBy('acta.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [datos, total] = await qb.getManyAndCount();

    return {
      data: datos.map((d) => this.toModel(d)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async generarSiguienteNumeroActa(): Promise<string> {
    const anio = new Date().getFullYear();
    const prefijo = `ACTA-${anio}-`;
    const ultimo = await this.repo
      .createQueryBuilder('acta')
      .where('acta.numeroActa LIKE :prefijo', { prefijo: `${prefijo}%` })
      .orderBy('acta.numeroActa', 'DESC')
      .getOne();

    if (!ultimo) {
      return `${prefijo}0001`;
    }

    const partes = ultimo.numeroActa.split('-');
    const consecutivo = parseInt(partes[partes.length - 1], 10);
    const nuevoNumero = (consecutivo + 1).toString().padStart(4, '0');
    return `${prefijo}${nuevoNumero}`;
  }
}
