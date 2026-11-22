import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoTurnoEnum } from '../../enums/estado-turno.enum.js';
import { TurnoModel } from '../../domain/models/turno.model.js';
import {
  TURNO_REPOSITORY_PORT,
  type TurnoRepositoryPort,
} from '../../domain/ports/turno-repository.port.js';

@Injectable()
export class CambiarEstadoTurnoUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY_PORT)
    private readonly turnoRepo: TurnoRepositoryPort,
  ) {}

  async marcarAtendido(id: string): Promise<TurnoModel> {
    const turno = await this.turnoRepo.findById(id);
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }

    if (turno.estado !== EstadoTurnoEnum.EN_ESPERA) {
      throw new BadRequestException(
        `No se puede marcar como atendido un turno en estado ${turno.estado}`,
      );
    }

    const horaAtencion = new Date().toTimeString().slice(0, 8);
    return this.turnoRepo.updateEstado(id, EstadoTurnoEnum.ATENDIDO, { horaAtencion });
  }

  async cancelar(id: string, motivo?: string): Promise<TurnoModel> {
    const turno = await this.turnoRepo.findById(id);
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }

    if (turno.estado === EstadoTurnoEnum.ATENDIDO) {
      throw new BadRequestException('No se puede cancelar un turno que ya ha sido atendido');
    }

    return this.turnoRepo.updateEstado(id, EstadoTurnoEnum.CANCELADO, {
      motivoCancelacion: motivo?.trim() || undefined,
    });
  }
}
