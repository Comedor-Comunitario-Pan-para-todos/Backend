import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  AUTORIZACION_TUTOR_REPOSITORY,
  type AutorizacionTutorRepository,
} from '../domain/autorizacion-tutor-repository.port.js';
import {
  MAX_SOPORTE_TUTOR_BYTES,
  type DatosTutor,
  type SoporteTutor,
} from '../domain/autorizacion-tutor.js';

const firmas = new Map([
  ['application/pdf', Buffer.from('%PDF-')],
  ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff])],
  ['image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
]);

@Injectable()
export class AutorizacionTutorService {
  constructor(
    @Inject(AUTORIZACION_TUTOR_REPOSITORY)
    private readonly repositorio: AutorizacionTutorRepository,
  ) {}

  async registrar(
    id: string,
    datos: DatosTutor,
    soporte: SoporteTutor | undefined,
    actorId: string,
  ) {
    if (soporte && soporte.buffer.length > MAX_SOPORTE_TUTOR_BYTES) {
      throw new PayloadTooLargeException('El soporte firmado supera 5 MiB');
    }
    const firma = soporte && firmas.get(soporte.mimetype);
    if (
      !soporte ||
      !firma ||
      soporte.buffer.length <= firma.length ||
      !soporte.buffer.subarray(0, firma.length).equals(firma)
    ) {
      throw new BadRequestException(
        'Adjunte el soporte firmado en PDF, JPG o PNG de hasta 5 MiB',
      );
    }
    const resultado = await this.repositorio.registrar(
      id,
      datos,
      soporte,
      actorId,
    );
    if (!resultado) throw new NotFoundException('Beneficiario no encontrado');
    if (resultado === 'edad-no-elegible')
      throw new ConflictException({
        code: 'BENEFICIARIO_MAYOR_EDAD',
        message:
          'La autorización del tutor requiere una fecha de nacimiento válida y correspondiente a un menor de edad',
      });
    if (resultado === 'activa')
      throw new ConflictException({
        code: 'AUTORIZACION_TUTOR_ACTIVA',
        message: 'La ficha ya tiene una autorización de tutor activa',
      });
    return resultado;
  }

  async revocar(id: string, motivo: string, actorId: string) {
    const resultado = await this.repositorio.revocar(id, motivo, actorId);
    if (!resultado)
      throw new NotFoundException(
        'No existe una autorización de tutor activa para esta ficha',
      );
    return resultado;
  }

  buscarActivas(ids: string[]) {
    return this.repositorio.buscarActivas(ids);
  }
}
