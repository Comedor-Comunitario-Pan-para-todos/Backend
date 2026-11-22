import { EstadoTurnoEnum } from '../../enums/estado-turno.enum.js';

export class TurnoModel {
  constructor(
    public readonly id: string,
    public readonly fecha: string,
    public readonly numeroTurno: number,
    public readonly beneficiarioId: string,
    public readonly emitidoPorUsuarioId: string,
    public readonly horaLlegada: string,
    public readonly estado: EstadoTurnoEnum = EstadoTurnoEnum.EN_ESPERA,
    public readonly horaAtencion?: string | null,
    public readonly motivoCancelacion?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly beneficiario?: {
      id: string;
      nombres: string;
      apellidos: string;
      numeroDocumento?: string | null;
      tipoDocumento?: string | null;
    },
    public readonly emitidoPor?: {
      id: string;
      nombreCompleto: string;
      email: string;
    },
  ) {}

  get estaEnEspera(): boolean {
    return this.estado === EstadoTurnoEnum.EN_ESPERA;
  }

  get fueAtendido(): boolean {
    return this.estado === EstadoTurnoEnum.ATENDIDO;
  }
}
