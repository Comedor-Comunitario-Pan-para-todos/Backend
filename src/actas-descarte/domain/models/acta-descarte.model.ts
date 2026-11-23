import { EstadoActaEnum, TipoDonanteEnum } from '../../dto/crear-acta-descarte.dto.js';

export class EvidenciaFotoModel {
  constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly mimeType: string,
    public readonly descripcion?: string,
  ) {}
}

export class ActaDescarteModel {
  constructor(
    public readonly id: string,
    public readonly numeroActa: string,
    public readonly donacionOrigenId: string,
    public readonly insumo: string,
    public readonly cantidad: number,
    public readonly unidadMedida: string,
    public readonly tipoDonante: TipoDonanteEnum,
    public readonly motivo: string,
    public readonly estado: EstadoActaEnum,
    public readonly evidencias: EvidenciaFotoModel[],
    public readonly generadaPorId: string,
    public readonly autorizadaPorId?: string,
    public readonly fechaAutorizacion?: Date,
    public readonly observaciones?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {
    if (cantidad <= 0) {
      throw new Error('La cantidad a dar de baja debe ser mayor a cero.');
    }
  }
}
