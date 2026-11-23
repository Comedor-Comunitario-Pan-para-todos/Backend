export enum MetodoConsentimiento {
  FIRMA_SIMPLE = 'FIRMA_SIMPLE',
  HUELLA = 'HUELLA',
  VERBAL_CON_TESTIGO = 'VERBAL_CON_TESTIGO',
}

export const FINALIDAD_CONSENTIMIENTO = 'ATENCION_ALIMENTARIA';

export interface AceptacionConsentimiento {
  aceptado: boolean;
  versionTexto: number;
  finalidad: typeof FINALIDAD_CONSENTIMIENTO;
  metodo: MetodoConsentimiento;
}

export interface ConsentimientoBeneficiario {
  id: string;
  beneficiarioId: string;
  aceptado: true;
  versionTexto: number;
  finalidad: typeof FINALIDAD_CONSENTIMIENTO;
  metodo: MetodoConsentimiento;
  registradoPorId: string;
  registradoEn: Date;
}
