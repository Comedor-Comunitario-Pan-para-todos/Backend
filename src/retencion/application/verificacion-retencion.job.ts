import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { RetencionService } from './retencion.service.js';

@Injectable()
export class VerificacionRetencionJob
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(VerificacionRetencionJob.name);
  private timer?: ReturnType<typeof setTimeout>;
  private ejecucion?: Promise<void>;
  private detenido = false;

  constructor(private readonly service: RetencionService) {}

  onApplicationBootstrap() {
    this.programar(60_000);
  }

  async onModuleDestroy() {
    this.detenido = true;
    clearTimeout(this.timer);
    await this.ejecucion;
  }

  private programar(espera: number) {
    this.timer = setTimeout(() => {
      this.ejecucion = this.service
        .verificar()
        .catch(() =>
          this.logger.error('No se pudo verificar la política de retención'),
        )
        .finally(() => {
          if (!this.detenido) this.programar(24 * 60 * 60 * 1000);
        });
    }, espera).unref();
  }
}
