import type { ConsentimientoBeneficiario } from './consentimiento.js';

export interface ConsentimientoConOperador extends ConsentimientoBeneficiario {
  registradoPor: { id: string; nombreCompleto: string | null };
}

export const CONSENTIMIENTO_REPOSITORY = Symbol('CONSENTIMIENTO_REPOSITORY');

export interface ConsentimientoRepository {
  buscarVigentes(
    beneficiarioIds: string[],
  ): Promise<ConsentimientoConOperador[]>;
  registrar(consentimiento: ConsentimientoBeneficiario): Promise<{
    creado: boolean;
    consentimiento: ConsentimientoConOperador;
  } | null>;
}
