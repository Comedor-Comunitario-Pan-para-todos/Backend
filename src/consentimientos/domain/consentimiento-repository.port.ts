import type { ConsentimientoBeneficiario } from './consentimiento.js';

export interface ConsentimientoConOperador extends ConsentimientoBeneficiario {
  autorizacionTutorId?: string | null;
  registradoPor: { id: string; nombreCompleto: string | null };
}

export const CONSENTIMIENTO_REPOSITORY = Symbol('CONSENTIMIENTO_REPOSITORY');

export interface ConsentimientoRepository {
  buscarVigentes(
    beneficiarioIds: string[],
  ): Promise<ConsentimientoConOperador[]>;
  buscarImagenesVigentes(
    beneficiarioIds: string[],
  ): Promise<ConsentimientoConOperador[]>;
  historialImagen(
    beneficiarioId: string,
  ): Promise<ConsentimientoConOperador[] | null>;
  revocarImagen(
    beneficiarioId: string,
    actorId: string,
  ): Promise<ConsentimientoConOperador | null>;
  registrar(
    consentimiento: ConsentimientoBeneficiario,
    puedeAutorizarMenor: boolean,
  ): Promise<
    | {
        creado: boolean;
        consentimiento: ConsentimientoConOperador;
      }
    | 'requiere-tutor'
    | 'requiere-coordinadora'
    | null
  >;
}
