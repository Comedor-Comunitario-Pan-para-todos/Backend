import { clasificarEdad } from '../../beneficiarios/domain/edad-beneficiario.js';

export function imagenAplicaParaEdad(
  fechaNacimiento: string,
  autorizacionTutorId: string | null | undefined,
  tutorActivoId?: string,
): boolean {
  const edad = clasificarEdad(fechaNacimiento);
  if (edad === 'adulto') return !autorizacionTutorId;
  return (
    edad === 'menor' && !!tutorActivoId && autorizacionTutorId === tutorActivoId
  );
}
