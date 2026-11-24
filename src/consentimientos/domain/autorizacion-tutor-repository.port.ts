import type {
  AutorizacionTutorConOperadores,
  DatosTutor,
  SoporteTutor,
} from './autorizacion-tutor.js';

export const AUTORIZACION_TUTOR_REPOSITORY = Symbol(
  'AUTORIZACION_TUTOR_REPOSITORY',
);

export interface AutorizacionTutorRepository {
  registrar(
    id: string,
    datos: DatosTutor,
    soporte: SoporteTutor,
    actorId: string,
  ): Promise<
    AutorizacionTutorConOperadores | 'edad-no-elegible' | 'activa' | null
  >;
  revocar(
    id: string,
    motivo: string,
    actorId: string,
  ): Promise<AutorizacionTutorConOperadores | null>;
  buscarActivas(ids: string[]): Promise<AutorizacionTutorConOperadores[]>;
}
