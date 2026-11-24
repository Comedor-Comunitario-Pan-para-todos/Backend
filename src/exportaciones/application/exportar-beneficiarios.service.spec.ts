import { describe, expect, it, vi } from 'vitest';
import { ExportarBeneficiariosService } from './exportar-beneficiarios.service.js';

describe('ExportarBeneficiariosService', () => {
  const montar = () => {
    const repo = {
      buscarBeneficiarios: vi.fn().mockResolvedValue([]),
      auditar: vi.fn().mockResolvedValue(undefined),
    };
    const excel = { generar: vi.fn().mockResolvedValue(Buffer.from('xlsx')) };
    return {
      repo,
      excel,
      servicio: new ExportarBeneficiariosService(repo, excel),
    };
  };

  it('rechaza un rango invertido antes de consultar', async () => {
    const { repo, servicio } = montar();
    await expect(
      servicio.ejecutar(
        { desde: '2026-11-25', hasta: '2026-11-24' },
        'usuario',
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(repo.buscarBeneficiarios).not.toHaveBeenCalled();
  });

  it('audita una exportación vacía y espera la escritura antes de entregar', async () => {
    const { repo, servicio } = montar();
    await expect(servicio.ejecutar({}, 'usuario')).resolves.toEqual(
      Buffer.from('xlsx'),
    );
    expect(repo.auditar).toHaveBeenCalledExactlyOnceWith('usuario', 0, {});
    repo.auditar.mockRejectedValue(new Error('Auditoría no disponible'));
    await expect(servicio.ejecutar({}, 'usuario')).rejects.toThrow(
      'Auditoría no disponible',
    );
  });

  it('omite el registro de descarga si la generación falla', async () => {
    const { repo, excel, servicio } = montar();
    excel.generar.mockRejectedValue(new Error('No se pudo generar'));
    await expect(servicio.ejecutar({}, 'usuario')).rejects.toThrow(
      'No se pudo generar',
    );
    expect(repo.auditar).not.toHaveBeenCalled();
  });
});
