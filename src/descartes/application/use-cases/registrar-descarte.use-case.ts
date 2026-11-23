import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  DESCARTE_REPOSITORY_PORT,
  type DescarteRepositoryPort,
} from '../../domain/ports/descarte-repository.port.js';
import { CrearDescarteDto } from '../../dto/crear-descarte.dto.js';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: {
    nombre: RolEnum;
  };
}

@Injectable()
export class RegistrarDescarteUseCase {
  constructor(
    @Inject(DESCARTE_REPOSITORY_PORT)
    private readonly descarteRepo: DescarteRepositoryPort,
  ) {}

  async execute(dto: CrearDescarteDto, usuario: UsuarioAutenticado) {
    // 1. Criterio de Aceptación: "autorizado por" obligatorio y reservado para COORDINADORA
    if (!usuario || !usuario.rol || usuario.rol.nombre !== RolEnum.COORDINADORA) {
      throw new ForbiddenException(
        'Solo la Coordinadora del comedor está autorizada para aprobar descartes de alimentos',
      );
    }

    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad a descartar debe ser un valor positivo mayor a 0');
    }

    const fechaDescarte = dto.fecha ? new Date(dto.fecha) : new Date();

    return this.descarteRepo.save({
      alimento: dto.alimento.trim(),
      cantidad: dto.cantidad,
      unidadMedida: dto.unidadMedida.trim().toUpperCase(),
      motivo: dto.motivo.trim(),
      fecha: fechaDescarte,
      evaluadoPor: dto.evaluadoPor.trim(),
      autorizadoPorId: usuario.id,
      loteId: dto.loteId ? dto.loteId.trim() : undefined,
    });
  }
}
