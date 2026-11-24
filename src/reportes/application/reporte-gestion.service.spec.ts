import { describe, expect, it, vi } from 'vitest';
import { ReporteGestionService } from './reporte-gestion.service.js';

describe('ReporteGestionService', () => {
  it('delega el mes y el actor autenticado al repositorio auditado', async () => {
    const consultar = vi
      .fn()
      .mockResolvedValue({ periodo: '2026-11', fotos: [] });
    const servicio = new ReporteGestionService({ consultar });
    await expect(servicio.consultar('2026-11', 'actor')).resolves.toEqual({
      periodo: '2026-11',
      fotos: [],
    });
    expect(consultar).toHaveBeenCalledExactlyOnceWith('2026-11', 'actor');
  });
});
