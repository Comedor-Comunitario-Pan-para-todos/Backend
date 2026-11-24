export enum MetodoConsentimiento {
  FIRMA_SIMPLE = 'FIRMA_SIMPLE',
  HUELLA = 'HUELLA',
  VERBAL_CON_TESTIGO = 'VERBAL_CON_TESTIGO',
}

export const FINALIDAD_CONSENTIMIENTO = 'ATENCION_ALIMENTARIA';
export const FINALIDAD_USO_IMAGEN = 'USO_IMAGEN';
export const FINALIDAD_REPORTE_ALCALDIA = 'REPORTE_ALCALDIA';
export const FINALIDADES_CONSENTIMIENTO = [
  FINALIDAD_CONSENTIMIENTO,
  FINALIDAD_USO_IMAGEN,
  FINALIDAD_REPORTE_ALCALDIA,
] as const;
export type FinalidadConsentimiento =
  (typeof FINALIDADES_CONSENTIMIENTO)[number];

export interface AceptacionConsentimiento {
  aceptado: boolean;
  versionTexto: number;
  finalidad: FinalidadConsentimiento;
  metodo: MetodoConsentimiento;
}

export interface ConsentimientoBeneficiario {
  id: string;
  beneficiarioId: string;
  aceptado: true;
  versionTexto: number;
  finalidad: FinalidadConsentimiento;
  metodo: MetodoConsentimiento;
  registradoPorId: string;
  registradoEn: Date;
}
