import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  FINALIDADES_CONSENTIMIENTO,
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
    !FINALIDADES_CONSENTIMIENTO.includes(aceptacion.finalidad) ||
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

  buscarVigentes(beneficiarioIds: string[]) {
    return this.repository.buscarVigentes(beneficiarioIds);
  }

  buscarImagenesVigentes(beneficiarioIds: string[]) {
    return this.repository.buscarImagenesVigentes(beneficiarioIds);
  }

  async historialImagen(id: string) {
    const resultado = await this.repository.historialImagen(id);
    if (!resultado) throw new NotFoundException('Beneficiario no encontrado');
    return resultado;
  }

  async revocarImagen(id: string, actorId: string) {
    const resultado = await this.repository.revocarImagen(id, actorId);
    if (!resultado)
      throw new NotFoundException(
        'No existe un permiso de imagen vigente para esta ficha',
      );
    return resultado;
  }

  async registrar(
    beneficiarioId: string,
    aceptacion: AceptacionConsentimiento,
    usuarioId: string,
    puedeAutorizarMenor = false,
  ) {
    const consentimiento: ConsentimientoBeneficiario = {
      beneficiarioId,
      ...prepararConsentimiento(aceptacion, usuarioId),
    };
    const resultado = await this.repository.registrar(
      consentimiento,
      puedeAutorizarMenor,
    );
    if (!resultado) {
      throw new NotFoundException('Beneficiario no encontrado');
    }
    if (resultado === 'requiere-coordinadora') {
      throw new ForbiddenException({
        code: 'REQUIERE_COORDINADORA',
        message:
          'Solo la Coordinadora puede autorizar el uso de imagen de un menor',
      });
    }
    if (resultado === 'requiere-tutor') {
      throw new ConflictException({
        code: 'REQUIERE_TUTOR',
        message:
          'El uso de imagen requiere autorización expresa y verificada del tutor',
      });
    }
    return resultado;
  }
}
