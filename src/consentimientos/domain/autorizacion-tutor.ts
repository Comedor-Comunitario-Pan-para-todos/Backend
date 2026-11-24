export enum TipoDocumentoTutor {
  CC = 'CC',
  CE = 'CE',
  PPT = 'PPT',
  PASAPORTE = 'PASAPORTE',
}

export enum ParentescoTutor {
  MADRE = 'MADRE',
  PADRE = 'PADRE',
  ACUDIENTE = 'ACUDIENTE',
  TUTOR_LEGAL = 'TUTOR_LEGAL',
}

export enum EstadoAutorizacionTutor {
  ACTIVA = 'ACTIVA',
  REVOCADA = 'REVOCADA',
}

export const MAX_SOPORTE_TUTOR_BYTES = 5 * 1024 * 1024;

export interface DatosTutor {
  nombreTutor: string;
  tipoDocumentoTutor: TipoDocumentoTutor;
  numeroDocumentoTutor: string;
  parentesco: ParentescoTutor;
  telefonoTutor: string;
}

export interface SoporteTutor {
  buffer: Buffer;
  mimetype: string;
}

export interface AutorizacionTutor extends DatosTutor {
  id: string;
  beneficiarioId: string;
  estado: EstadoAutorizacionTutor;
  aprobadaPorId: string;
  fechaAprobacion: Date;
  soporteTipoMime: string;
  soporteTamanoBytes: number;
  revocadaPorId: string | null;
  fechaRevocacion: Date | null;
  motivoRevocacion: string | null;
}

type OperadorTutor = { id: string; nombreCompleto: string | null };

export interface AutorizacionTutorConOperadores extends AutorizacionTutor {
  aprobadaPor: OperadorTutor;
  revocadaPor: OperadorTutor | null;
}
