import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONSENTIMIENTO_REPOSITORY,
  type ConsentimientoRepository,
} from '../domain/consentimiento-repository.port.js';
import { randomUUID } from 'node:crypto';
import {
  FINALIDAD_CONSENTIMIENTO,
  MetodoConsentimiento,
  type AceptacionConsentimiento,
  type ConsentimientoBeneficiario,
} from '../domain/consentimiento.js';

export function prepararConsentimiento(
  aceptacion: AceptacionConsentimiento | undefined,
  registradoPorId: string,
) {
  if (aceptacion?.aceptado !== true) {
    throw new BadRequestException(
      'Se requiere la aceptación explícita del consentimiento',
    );
  }

  if (
    !Number.isInteger(aceptacion.versionTexto) ||
    aceptacion.versionTexto < 1 ||
    aceptacion.versionTexto > 2147483647 ||
    aceptacion.finalidad !== FINALIDAD_CONSENTIMIENTO ||
    !Object.values(MetodoConsentimiento).includes(aceptacion.metodo)
  ) {
    throw new BadRequestException('Los datos del consentimiento son inválidos');
  }

  return {
    id: randomUUID(),
    aceptado: true as const,
    versionTexto: aceptacion.versionTexto,
    finalidad: aceptacion.finalidad,
    metodo: aceptacion.metodo,
    registradoPorId,
    registradoEn: new Date(),
  };
}

@Injectable()
export class ConsentimientosService {
  constructor(
    @Inject(CONSENTIMIENTO_REPOSITORY)
    private readonly repository: ConsentimientoRepository,
  ) {}

  async registrar(
    beneficiarioId: string,
    aceptacion: AceptacionConsentimiento,
    usuarioId: string,
  ) {
    const consentimiento: ConsentimientoBeneficiario = {
      beneficiarioId,
      ...prepararConsentimiento(aceptacion, usuarioId),
    };
    const resultado = await this.repository.registrar(consentimiento);
    if (!resultado) {
      throw new NotFoundException('Beneficiario no encontrado');
    }
    return resultado;
  }
}
