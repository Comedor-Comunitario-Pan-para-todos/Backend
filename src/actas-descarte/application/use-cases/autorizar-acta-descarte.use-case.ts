import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ACTA_DESCARTE_REPOSITORY_PORT,
  type ActaDescarteRepositoryPort,
} from '../../domain/ports/acta-descarte-repository.port.js';
import { AutorizarActaDto, EstadoActaEnum } from '../../dto/crear-acta-descarte.dto.js';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';

export interface UsuarioRevisor {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: {
    nombre: RolEnum;
  };
}

@Injectable()
export class AutorizarActaDescarteUseCase {
  constructor(
    @Inject(ACTA_DESCARTE_REPOSITORY_PORT)
    private readonly actaRepo: ActaDescarteRepositoryPort,
  ) {}

  async execute(id: string, dto: AutorizarActaDto, usuario: UsuarioRevisor) {
    if (!usuario || !usuario.rol || usuario.rol.nombre !== RolEnum.COORDINADORA) {
      throw new ForbiddenException(
        'Solo la Coordinadora del comedor puede autorizar las actas de descarte',
      );
    }

    const acta = await this.actaRepo.findById(id);
    if (!acta) {
      throw new NotFoundException(`Acta de descarte con ID ${id} no encontrada`);
    }

    if (acta.estado !== EstadoActaEnum.PENDIENTE) {
      throw new BadRequestException(
        `El acta ya fue procesada anteriormente y se encuentra en estado ${acta.estado}`,
      );
    }

    return this.actaRepo.save({
      id: acta.id,
      numeroActa: acta.numeroActa,
      donacionOrigenId: acta.donacionOrigenId,
      insumo: acta.insumo,
      cantidad: acta.cantidad,
      unidadMedida: acta.unidadMedida,
      tipoDonante: acta.tipoDonante,
      motivo: acta.motivo,
      estado: EstadoActaEnum.AUTORIZADA,
      evidencias: acta.evidencias,
      generadaPorId: acta.generadaPorId,
      autorizadaPorId: usuario.id,
      fechaAutorizacion: new Date(),
      observaciones: dto.observaciones ?? acta.observaciones,
    });
  }
}
