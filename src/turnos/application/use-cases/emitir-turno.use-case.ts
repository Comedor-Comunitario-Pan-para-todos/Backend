import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BENEFICIARIO_REPOSITORY_PORT,
  type BeneficiarioRepositoryPort,
} from '../../../beneficiarios/domain/ports/beneficiario-repository.port.js';
import { EstadoTurnoEnum } from '../../enums/estado-turno.enum.js';
import { TurnoModel } from '../../domain/models/turno.model.js';
import {
  TURNO_REPOSITORY_PORT,
  type TurnoRepositoryPort,
} from '../../domain/ports/turno-repository.port.js';

@Injectable()
export class EmitirTurnoUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY_PORT)
    private readonly turnoRepo: TurnoRepositoryPort,
    @Inject(BENEFICIARIO_REPOSITORY_PORT)
    private readonly beneficiarioRepo: BeneficiarioRepositoryPort,
  ) {}

  async execute(beneficiarioId: string, emitidoPorUsuarioId: string): Promise<TurnoModel> {
    // 1. Validar que el beneficiario existe en el padrón central (HU-26 Criterio 1)
    const beneficiario = await this.beneficiarioRepo.findById(beneficiarioId);
    if (!beneficiario) {
      throw new NotFoundException(`El beneficiario con ID ${beneficiarioId} no existe en el padrón central`);
    }

    // 2. Obtener fecha y hora actual local
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10); // AAAA-MM-DD
    const horaLlegada = ahora.toTimeString().slice(0, 8); // HH:mm:ss

    // 3. Validar duplicidad en la misma jornada (HU-27 Criterios 1 y 2)
    const turnoExistente = await this.turnoRepo.findByBeneficiarioYFecha(beneficiarioId, fecha);
    if (turnoExistente) {
      throw new ConflictException({
        statusCode: 409,
        message: `El beneficiario ya cuenta con el Turno #${turnoExistente.numeroTurno} asignado para la jornada de hoy`,
        error: 'Conflict',
        turnoExistente: {
          id: turnoExistente.id,
          numeroTurno: turnoExistente.numeroTurno,
          horaLlegada: turnoExistente.horaLlegada,
          estado: turnoExistente.estado,
          fecha: turnoExistente.fecha,
        },
      });
    }

    // 4. Calcular el consecutivo diario atómicamente (HU-26 Criterio 2)
    const numeroTurno = await this.turnoRepo.obtenerSiguienteNumeroTurno(fecha);

    // 5. Asentar el turno en estado EN_ESPERA (HU-26 Criterio 3)
    return await this.turnoRepo.save({
      fecha,
      numeroTurno,
      beneficiarioId,
      emitidoPorUsuarioId,
      horaLlegada,
      estado: EstadoTurnoEnum.EN_ESPERA,
    });
  }
}
