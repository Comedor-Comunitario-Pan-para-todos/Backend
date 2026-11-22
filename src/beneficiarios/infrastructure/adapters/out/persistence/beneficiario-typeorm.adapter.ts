import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiarioModel } from '../../../../domain/models/beneficiario.model.js';
import {
  BeneficiarioPaginatedResult,
  BeneficiarioPaginationOptions,
  BeneficiarioRepositoryPort,
} from '../../../../domain/ports/beneficiario-repository.port.js';
import { Beneficiario } from '../../../../entities/beneficiario.entity.js';

@Injectable()
export class BeneficiarioTypeOrmAdapter implements BeneficiarioRepositoryPort {
  constructor(
    @InjectRepository(Beneficiario)
    private readonly repo: Repository<Beneficiario>,
  ) {}

  private toModel(b: Beneficiario): BeneficiarioModel {
    return new BeneficiarioModel(
      b.id,
      b.nivelRegistro,
      b.tipoDocumento ?? null,
      b.numeroDocumento ?? null,
      b.nombres,
      b.apellidos,
      b.fechaNacimiento,
      b.esMenorEdad ?? false,
      b.barrio,
      b.telefono,
      b.clasificacionSocioeconomica,
      b.autorizaTratamientoDatos,
      b.createdAt,
      b.updatedAt,
      b.deletedAt,
    );
  }

  async save(data: Partial<BeneficiarioModel>): Promise<BeneficiarioModel> {
    const entidad = this.repo.create(data as Partial<Beneficiario>);
    const guardado = await this.repo.save(entidad);
    return this.toModel(guardado);
  }

  async findByDocumento(numeroDocumento: string): Promise<BeneficiarioModel | null> {
    const b = await this.repo.findOne({ where: { numeroDocumento } });
    return b ? this.toModel(b) : null;
  }

  async findById(id: string): Promise<BeneficiarioModel | null> {
    const b = await this.repo.findOne({ where: { id } });
    return b ? this.toModel(b) : null;
  }

  async findByDatosBasicos(
    nombres: string,
    apellidos: string,
    fechaNacimiento: string,
    barrio?: string,
  ): Promise<BeneficiarioModel | null> {
    const qb = this.repo.createQueryBuilder('beneficiario')
      .where('LOWER(beneficiario.nombres) = LOWER(:nombres)', { nombres: nombres.trim() })
      .andWhere('LOWER(beneficiario.apellidos) = LOWER(:apellidos)', { apellidos: apellidos.trim() })
      .andWhere('beneficiario.fechaNacimiento = :fechaNacimiento', { fechaNacimiento });

    if (barrio) {
      qb.andWhere('LOWER(beneficiario.barrio) = LOWER(:barrio)', { barrio: barrio.trim() });
    }

    const b = await qb.getOne();
    return b ? this.toModel(b) : null;
  }

  async search(options: BeneficiarioPaginationOptions): Promise<BeneficiarioPaginatedResult> {
    const { page, limit, busqueda } = options;
    const qb = this.repo.createQueryBuilder('beneficiario');

    if (busqueda) {
      qb.where(
        '(beneficiario.numeroDocumento LIKE :busqueda OR LOWER(beneficiario.nombres) LIKE :busquedaLower OR LOWER(beneficiario.apellidos) LIKE :busquedaLower OR LOWER(CONCAT(beneficiario.nombres, \' \', beneficiario.apellidos)) LIKE :busquedaLower)',
        {
          busqueda: `%${busqueda}%`,
          busquedaLower: `%${busqueda.toLowerCase()}%`,
        },
      );
    }

    qb.orderBy('beneficiario.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((b) => this.toModel(b)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
