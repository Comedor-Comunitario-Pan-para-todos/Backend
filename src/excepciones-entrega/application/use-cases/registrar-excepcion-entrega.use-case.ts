import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXCEPCION_ENTREGA_REPOSITORY_PORT,
  type ExcepcionEntregaRepositoryPort,
} from '../../domain/ports/excepcion-entrega-repository.port.js';
import {
  TURNO_REPOSITORY_PORT,
  type TurnoRepositoryPort,
} from '../../../turnos/domain/ports/turno-repository.port.js';
import {
  USUARIO_REPOSITORY_PORT,
  type UsuarioRepositoryPort,
} from '../../../usuarios/domain/ports/usuario-repository.port.js';
import { CrearExcepcionEntregaDto } from '../../dto/crear-excepcion-entrega.dto.js';
import { RolEnum } from '../../../usuarios/enums/rol.enum.js';
import { ExcepcionEntregaModel } from '../../domain/models/excepcion-entrega.model.js';

@Injectable()
export class RegistrarExcepcionEntregaUseCase {
  constructor(
    @Inject(EXCEPCION_ENTREGA_REPOSITORY_PORT)
    private readonly excepcionRepo: ExcepcionEntregaRepositoryPort,
    @Inject(TURNO_REPOSITORY_PORT)
    private readonly turnoRepo: TurnoRepositoryPort,
    @Inject(USUARIO_REPOSITORY_PORT)
    private readonly usuarioRepo: UsuarioRepositoryPort,
  ) {}

  async execute(dto: CrearExcepcionEntregaDto): Promise<ExcepcionEntregaModel> {
    // 1. Criterio de Aceptación: Justificación descriptiva obligatoria y no vacía
    if (!dto.justificacion || !dto.justificacion.trim()) {
      throw new BadRequestException('La justificación es obligatoria y no puede estar vacía');
    }

    if (dto.justificacion.trim().length > 255) {
      throw new BadRequestException('La justificación no puede superar los 255 caracteres');
    }

    // 2. Validación de cantidad de raciones positivas
    const cantidad = dto.cantidadRaciones !== undefined ? dto.cantidadRaciones : 1;
    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad de raciones debe ser un número entero mayor a 0');
    }

    // 3. Precondición: El turno de atención debe existir
    const turnoExistente = await this.turnoRepo.findById(dto.turnoId);
    if (!turnoExistente) {
      throw new NotFoundException(`El turno de atención con ID '${dto.turnoId}' no existe`);
    }

    // 4. Restricción de Integridad (MER): Relación 1:1 única entre Turno y Excepción
    const excepcionExistente = await this.excepcionRepo.findByTurnoId(dto.turnoId);
    if (excepcionExistente) {
      throw new ConflictException(
        `Ya existe una excepción de entrega registrada para el turno '${dto.turnoId}'`,
      );
    }

    // 5. Criterio de Aceptación: Usuario autorizador obligatorio y con rol de COORDINADORA
    const autorizador = await this.usuarioRepo.findById(dto.autorizadoPorUsuarioId);
    if (!autorizador) {
      throw new NotFoundException(
        `El usuario autorizador con ID '${dto.autorizadoPorUsuarioId}' no existe`,
      );
    }

    if (!autorizador.activo) {
      throw new BadRequestException(
        'El usuario autorizador se encuentra inactivo y no puede autorizar excepciones',
      );
    }

    const rolNombre = autorizador.rol?.nombre;
    if (rolNombre !== RolEnum.COORDINADORA) {
      throw new BadRequestException(
        'El usuario autorizador debe tener rol de COORDINADORA para aprobar entregas extraordinarias',
      );
    }

    // 6. Asentar la excepción de entrega
    return this.excepcionRepo.save({
      turnoId: dto.turnoId,
      autorizadoPorUsuarioId: dto.autorizadoPorUsuarioId,
      tipoExcepcion: dto.tipoExcepcion,
      justificacion: dto.justificacion.trim(),
      cantidadRaciones: cantidad,
      fechaHora: new Date(),
    });
  }
}
