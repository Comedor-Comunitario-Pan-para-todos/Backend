import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Beneficiario } from './entities/beneficiario.entity.js';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto.js';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto.js';
import { QueryBeneficiariosDto } from './dto/query-beneficiarios.dto.js';
import { NivelRegistroEnum } from './enums/nivel-registro.enum.js';
import { BeneficiarioModel } from './domain/models/beneficiario.model.js';

import { prepararConsentimiento } from '../consentimientos/application/consentimientos.service.js';
import { consentimientoBeneficiarioSchema } from '../consentimientos/infrastructure/consentimiento.schema.js';

import { FINALIDAD_CONSENTIMIENTO } from '../consentimientos/domain/consentimiento.js';

@Injectable()
export class BeneficiariosService {
  constructor(
    @InjectRepository(Beneficiario)
    private readonly beneficiarioRepository: Repository<Beneficiario>,
  ) {}

  // 1. Crear beneficiario validando nivel de sensibilidad y duplicados (RF-01, RF-02, RNF-15)
  async create(dto: CreateBeneficiarioDto, usuarioId: string): Promise<Beneficiario> {
    if (dto.autorizaTratamientoDatos !== true) {
      throw new BadRequestException('Se requiere la autorización explícita de datos');
    }
    const consentimiento = prepararConsentimiento(dto.consentimiento, usuarioId);
    if (consentimiento.finalidad !== FINALIDAD_CONSENTIMIENTO) {
      throw new BadRequestException('El alta requiere consentimiento para atención alimentaria');
    }
    const nivelRegistro = dto.nivelRegistro || NivelRegistroEnum.BASICO;

    // Validación condicional del formulario extendido (RF-02 / HU-13 Criterio 3)
    if (nivelRegistro === NivelRegistroEnum.EXTENDIDO) {
      if ((dto.tipoDocumento && !dto.numeroDocumento) || (!dto.tipoDocumento && dto.numeroDocumento)) {
        throw new BadRequestException(
          'En el registro extendido, si se especifica el tipo de documento también debe indicarse el número y viceversa',
        );
      }
    }

    // Minimización de datos para el nivel básico (RF-02 / HU-13 Criterio 4 - Ley 1581)
    const datosPersistir: Partial<Beneficiario> = {
      nivelRegistro,
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      fechaNacimiento: dto.fechaNacimiento,
      barrio: dto.barrio?.trim() || undefined,
      autorizaTratamientoDatos: dto.autorizaTratamientoDatos,
      esMenorEdad: BeneficiarioModel.calcularEsMenorEdad(dto.fechaNacimiento),
    };

    if (nivelRegistro === NivelRegistroEnum.EXTENDIDO) {
      datosPersistir.tipoDocumento = dto.tipoDocumento || undefined;
      datosPersistir.numeroDocumento = dto.numeroDocumento || undefined;
      datosPersistir.telefono = dto.telefono?.trim() || undefined;
      datosPersistir.clasificacionSocioeconomica = dto.clasificacionSocioeconomica?.trim() || undefined;
    }

    // Prevención de duplicados (RF-01, RNF-15)
    try {
      if (datosPersistir.numeroDocumento) {
        await this.assertDocumentoDisponible(datosPersistir.numeroDocumento);
      } else {
        await this.assertDatosBasicosDisponibles(
          datosPersistir.nombres!,
          datosPersistir.apellidos!,
          datosPersistir.fechaNacimiento!,
          datosPersistir.barrio,
        );
      }

      const beneficiario = this.beneficiarioRepository.create(datosPersistir);

      return await this.beneficiarioRepository.manager.transaction(async (manager) => {
        const guardado = await this.saveBeneficiario(beneficiario, manager.getRepository(Beneficiario));
        await manager.insert(consentimientoBeneficiarioSchema, {
          ...consentimiento,
          beneficiarioId: guardado.id,
        });
        return guardado;
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('No se pudo guardar el alta del beneficiario');
      }
      throw error;
    }
  }

  // 2. Búsqueda en tiempo real con filtros y paginación (RF-01)
  async findAll(query: QueryBeneficiariosDto) {
    const { page, limit, search, barrio } = query;

    const qb = this.beneficiarioRepository.createQueryBuilder('beneficiario');

    // Búsqueda en tiempo real por documento, nombre, apellido o nombre completo
    if (search) {
      const searchLiteral = search.replace(/[!%_]/g, '!$&');
      qb.andWhere(
        "(beneficiario.numeroDocumento LIKE :search ESCAPE '!' OR LOWER(beneficiario.nombres) LIKE LOWER(:search) ESCAPE '!' OR LOWER(beneficiario.apellidos) LIKE LOWER(:search) ESCAPE '!' OR LOWER(CONCAT(beneficiario.nombres, ' ', beneficiario.apellidos)) LIKE LOWER(:search) ESCAPE '!')",
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
    const docNormalizado = numeroDocumento
      ? numeroDocumento.replace(/[^a-zA-Z0-9]/g, '').trim()
      : '';

    if (!docNormalizado) {
      return { existe: false, beneficiario: null };
    }

    const beneficiario = await this.beneficiarioRepository.findOne({
      where: { numeroDocumento: docNormalizado },
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

    // Si se actualiza fecha de nacimiento, recalcular esMenorEdad
    if (dto.fechaNacimiento) {
      beneficiario.esMenorEdad = BeneficiarioModel.calcularEsMenorEdad(dto.fechaNacimiento);
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
    if (!numeroDocumento) return;

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
        `Ya existe un beneficiario registrado con este número de documento`,
      );
    }
  }

  // Valida que para personas indocumentadas no se repita nombres, apellidos, fecha de nacimiento y barrio (RNF-15)
  private async assertDatosBasicosDisponibles(
    nombres: string,
    apellidos: string,
    fechaNacimiento: string,
    barrio?: string,
    excluirId?: string,
  ) {
    const query = this.beneficiarioRepository
      .createQueryBuilder('beneficiario')
      .where('LOWER(beneficiario.nombres) = LOWER(:nombres)', { nombres: nombres.trim() })
      .andWhere('LOWER(beneficiario.apellidos) = LOWER(:apellidos)', {
        apellidos: apellidos.trim(),
      })
      .andWhere('beneficiario.fechaNacimiento = :fechaNacimiento', { fechaNacimiento });

    if (barrio) {
      query.andWhere('LOWER(beneficiario.barrio) = LOWER(:barrio)', { barrio: barrio.trim() });
    }

    if (excluirId) {
      query.andWhere('beneficiario.id != :excluirId', { excluirId });
    }

    const existe = await query.getOne();

    if (existe) {
      throw new ConflictException(
        'Ya existe un beneficiario registrado con los mismos nombres, apellidos, fecha de nacimiento y barrio',
      );
    }
  }

  // Captura el error UNIQUE de MySQL en caso de condiciones de carrera
  private async saveBeneficiario(
    beneficiario: Beneficiario,
    repository = this.beneficiarioRepository,
  ): Promise<Beneficiario> {
    try {
      return await repository.save(beneficiario);
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
