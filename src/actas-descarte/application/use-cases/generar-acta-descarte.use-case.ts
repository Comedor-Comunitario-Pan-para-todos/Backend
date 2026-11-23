import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ACTA_DESCARTE_REPOSITORY_PORT,
  type ActaDescarteRepositoryPort,
} from '../../domain/ports/acta-descarte-repository.port.js';
import {
  CrearActaDescarteDto,
  EstadoActaEnum,
  TipoDonanteEnum,
} from '../../dto/crear-acta-descarte.dto.js';
import { EvidenciaFotoModel } from '../../domain/models/acta-descarte.model.js';

@Injectable()
export class GenerarActaDescarteUseCase {
  constructor(
    @Inject(ACTA_DESCARTE_REPOSITORY_PORT)
    private readonly actaRepo: ActaDescarteRepositoryPort,
  ) {}

  async execute(dto: CrearActaDescarteDto, usuarioId: string) {
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad a dar de baja debe ser un valor positivo');
    }

    // Regla de Negocio: Para donantes corporativos la evidencia fotográfica JPG/PNG es OBLIGATORIA
    if (dto.tipoDonante === TipoDonanteEnum.CORPORATIVO) {
      if (!dto.evidencias || dto.evidencias.length === 0) {
        throw new BadRequestException(
          'Para donantes corporativos es obligatorio adjuntar al menos una fotografía de evidencia (JPG/PNG)',
        );
      }

      const formatosValidos = ['image/jpeg', 'image/png', 'image/jpg'];
      const formatoInvalido = dto.evidencias.some(
        (e) => !formatosValidos.includes(e.mimeType.toLowerCase()),
      );

      if (formatoInvalido) {
        throw new BadRequestException(
          'Las evidencias fotográficas deben ser exclusivamente en formato JPG o PNG',
        );
      }
    }

    const numeroActa = await this.actaRepo.generarSiguienteNumeroActa();

    const evidenciasModel = (dto.evidencias ?? []).map(
      (e, idx) =>
        new EvidenciaFotoModel(
          `evidencia-${Date.now()}-${idx}`,
          e.url,
          e.mimeType,
          e.descripcion,
        ),
    );

    return this.actaRepo.save({
      numeroActa,
      donacionOrigenId: dto.donacionOrigenId.trim(),
      insumo: dto.insumo.trim(),
      cantidad: dto.cantidad,
      unidadMedida: dto.unidadMedida.trim().toUpperCase(),
      tipoDonante: dto.tipoDonante,
      motivo: dto.motivo.trim(),
      estado: EstadoActaEnum.PENDIENTE,
      evidencias: evidenciasModel,
      generadaPorId: usuarioId,
    });
  }
}
