import type { ConsentimientoBeneficiario } from './consentimiento.js';

export const CONSENTIMIENTO_REPOSITORY = Symbol('CONSENTIMIENTO_REPOSITORY');

export interface ConsentimientoRepository {
  registrar(
    consentimiento: ConsentimientoBeneficiario,
  ): Promise<{
    creado: boolean;
    consentimiento: ConsentimientoBeneficiario;
  } | null>;
}
