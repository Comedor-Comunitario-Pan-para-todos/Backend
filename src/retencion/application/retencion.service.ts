import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  RETENCION_REPOSITORIO,
  type PlazosRetencion,
  type RetencionRepositorio,
} from '../domain/retencion.js';

@Injectable()
export class RetencionService {
  constructor(
    @Inject(RETENCION_REPOSITORIO)
    private readonly repositorio: RetencionRepositorio,
  ) {}

  consultar(actorId: string) {
    return this.repositorio.consultar(actorId);
  }

  async actualizar(plazos: PlazosRetencion, actorId: string, password: string) {
    for (const plazo of [plazos.diasBasicos, plazos.diasSensibles]) {
      if (!Number.isInteger(plazo) || plazo < 1 || plazo > 36500) {
        throw new BadRequestException(
          'Los plazos deben ser enteros entre 1 y 36500 días',
        );
      }
    }
    const politica = await this.repositorio.actualizar(
      plazos,
      actorId,
      password,
    );
    if (!politica)
      throw new ForbiddenException(
        'No se pudo confirmar la credencial de la Coordinadora',
      );
    return politica;
  }

  verificar(ahora = new Date()) {
    return this.repositorio.verificar(ahora);
  }
}
