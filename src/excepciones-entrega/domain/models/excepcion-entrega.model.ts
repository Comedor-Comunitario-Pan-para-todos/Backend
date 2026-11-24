import { TipoExcepcionEnum } from '../../enums/tipo-excepcion.enum.js';

export class ExcepcionEntregaModel {
  id: string;
  turnoId: string;
  autorizadoPorUsuarioId: string;
  tipoExcepcion: TipoExcepcionEnum;
  justificacion: string;
  cantidadRaciones: number;
  fechaHora: Date;
  createdAt?: Date;
  updatedAt?: Date;

  turno?: {
    id: string;
    fecha: string;
    numeroTurno: number;
    beneficiarioId: string;
    beneficiario?: {
      id: string;
      nombres: string;
      apellidos: string;
      numeroDocumento?: string;
    };
  };

  autorizadoPorUsuario?: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
}
