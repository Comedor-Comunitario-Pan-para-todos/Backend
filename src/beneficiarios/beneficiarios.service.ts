import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Beneficiario } from './entities/beneficiario.entity.js';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto.js';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto.js';
import { QueryBeneficiariosDto } from './dto/query-beneficiarios.dto.js';

@Injectable()
export class BeneficiariosService {
  constructor(
    @InjectRepository(Beneficiario)
    private readonly beneficiarioRepository: Repository<Beneficiario>,
  ) {}

  // 1. Crear beneficiario validando que no exista el documento (RF-01)
  async create(dto: CreateBeneficiarioDto): Promise<Beneficiario> {
    await this.assertDocumentoDisponible(dto.numeroDocumento);

    const beneficiario = this.beneficiarioRepository.create(dto);

    return await this.saveBeneficiario(beneficiario);
  }

  // 2. Búsqueda en tiempo real con filtros y paginación (RF-01)
  async findAll(query: QueryBeneficiariosDto) {
    const { page, limit, search, barrio } = query;

    const qb = this.beneficiarioRepository.createQueryBuilder('beneficiario');

    // Búsqueda en tiempo real por documento, nombre o apellido
    if (search) {
      const searchLiteral = search.replace(/[!%_]/g, '!$&');
      qb.andWhere(
        "(beneficiario.numeroDocumento LIKE :search ESCAPE '!' OR LOWER(beneficiario.nombres) LIKE LOWER(:search) ESCAPE '!' OR LOWER(beneficiario.apellidos) LIKE LOWER(:search) ESCAPE '!')",
        { search: `%${searchLiteral}%` },
      );
    }

    if (barrio) {
      qb.andWhere('beneficiario.barrio = :barrio', { barrio });
    }

    const [data, total] = await qb
      .orderBy('beneficiario.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 3. Consulta rápida para saber si un beneficiario ya existe (RF-01 Criterio 1)
  async validarDocumento(numeroDocumento: string) {
    const beneficiario = await this.beneficiarioRepository.findOne({
      where: { numeroDocumento: numeroDocumento.trim() },
    });

    return {
      existe: !!beneficiario,
      beneficiario: beneficiario || null,
    };
  }

  // 4. Buscar un beneficiario por su ID
  async findOne(id: string): Promise<Beneficiario> {
    const beneficiario = await this.beneficiarioRepository.findOne({
      where: { id },
    });

    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario con ID ${id} no encontrado`);
    }

    return beneficiario;
  }

  // 5. Actualizar datos de un beneficiario
  async update(id: string, dto: UpdateBeneficiarioDto): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id);

    // Si cambió el número de documento, validar que no esté ocupado por otro
    if (dto.numeroDocumento && dto.numeroDocumento !== beneficiario.numeroDocumento) {
      await this.assertDocumentoDisponible(dto.numeroDocumento, id);
    }

    Object.assign(beneficiario, dto);

    return await this.saveBeneficiario(beneficiario);
  }

  // 6. Eliminación lógica (soft delete) para conservar el historial
  async remove(id: string): Promise<{ mensaje: string }> {
    const beneficiario = await this.findOne(id);
    await this.beneficiarioRepository.softRemove(beneficiario);

    return {
      mensaje: `El beneficiario ${beneficiario.nombres} ${beneficiario.apellidos} ha sido desactivado correctamente`,
    };
  }

  // --- MÉTODOS AUXILIARES DE VALIDACIÓN ---

  // Valida que el documento no esté duplicado
  private async assertDocumentoDisponible(numeroDocumento: string, excluirId?: string) {
    const query = this.beneficiarioRepository
      .createQueryBuilder('beneficiario')
      .where('beneficiario.numeroDocumento = :numeroDocumento', {
        numeroDocumento: numeroDocumento.trim(),
      });

    if (excluirId) {
      query.andWhere('beneficiario.id != :excluirId', { excluirId });
    }

    const existe = await query.getOne();

    if (existe) {
      throw new ConflictException(
        `Ya existe un beneficiario registrado con el número de documento ${numeroDocumento}`,
      );
    }
  }

  // Captura el error UNIQUE de MySQL en caso de condiciones de carrera
  private async saveBeneficiario(beneficiario: Beneficiario): Promise<Beneficiario> {
    try {
      return await this.beneficiarioRepository.save(beneficiario);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Ya existe un beneficiario registrado con este número de documento',
        );
      }
      throw error;
    }
  }
}
