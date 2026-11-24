import { afterEach, describe, expect, it, vi } from 'vitest';
import { RetencionService } from './retencion.service.js';
import { VerificacionRetencionJob } from './verificacion-retencion.job.js';

describe('VerificacionRetencionJob', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ejecuta después del primer minuto y cada 24 horas, y se detiene al cerrar', async () => {
    vi.useFakeTimers();
    const verificar = vi.fn().mockResolvedValue(undefined);
    const servicio = new RetencionService({
      consultar: vi.fn(),
      actualizar: vi.fn(),
      verificar,
    });
    const job = new VerificacionRetencionJob(servicio);
    try {
      job.onApplicationBootstrap();
      await vi.advanceTimersByTimeAsync(59_999);
      expect(verificar).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(verificar).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(86_400_000);
      expect(verificar).toHaveBeenCalledTimes(2);
    } finally {
      await job.onModuleDestroy();
    }
    await vi.advanceTimersByTimeAsync(86_400_000);
    expect(verificar).toHaveBeenCalledTimes(2);
  });
});
