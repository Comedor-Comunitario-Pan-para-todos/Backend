import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_SOPORTE_TUTOR_BYTES,
  ParentescoTutor,
  TipoDocumentoTutor,
} from '../domain/autorizacion-tutor.js';
import { AutorizacionTutorService } from './autorizacion-tutor.service.js';

const datos = {
  nombreTutor: 'Tutor de prueba',
  tipoDocumentoTutor: TipoDocumentoTutor.CC,
  numeroDocumentoTutor: '123',
  parentesco: ParentescoTutor.TUTOR_LEGAL,
  telefonoTutor: '3001234567',
};
const soporte = {
  mimetype: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n%%EOF'),
};

describe('AutorizacionTutorService (RF-21)', () => {
  const registrar = vi.fn();
  const revocar = vi.fn();
  const service = new AutorizacionTutorService({
    registrar,
    revocar,
    buscarActivas: vi.fn(),
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    undefined,
    { mimetype: 'application/pdf', buffer: Buffer.alloc(0) },
    { mimetype: 'image/jpeg', buffer: Buffer.from('%PDF-1.4') },
    { mimetype: 'text/plain', buffer: Buffer.from('%PDF-1.4') },
    { mimetype: 'image/png', buffer: Buffer.from('no es PNG') },
  ])('rechaza el soporte inválido antes de persistir', async (archivo) => {
    await expect(
      service.registrar('ficha', datos, archivo, 'coord'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(registrar).not.toHaveBeenCalled();
  });

  it('rechaza el soporte de más de 5 MiB', async () => {
    await expect(
      service.registrar(
        'ficha',
        datos,
        { ...soporte, buffer: Buffer.alloc(MAX_SOPORTE_TUTOR_BYTES + 1) },
        'coord',
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(registrar).not.toHaveBeenCalled();
  });

  it.each(['edad-no-elegible', 'activa'])(
    'devuelve 409 para %s',
    async (estado) => {
      registrar.mockResolvedValue(estado);
      await expect(
        service.registrar('ficha', datos, soporte, 'coord'),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('propaga el actor autenticado en el registro y la revocación', async () => {
    registrar.mockResolvedValue({ id: 'autorizacion' });
    revocar.mockResolvedValue({ id: 'autorizacion', estado: 'REVOCADA' });
    await expect(
      service.registrar('ficha', datos, soporte, 'coord'),
    ).resolves.toEqual({ id: 'autorizacion' });
    await expect(
      service.revocar('ficha', 'Corrección', 'coord-2'),
    ).resolves.toEqual({ id: 'autorizacion', estado: 'REVOCADA' });
    expect(registrar).toHaveBeenCalledExactlyOnceWith(
      'ficha',
      datos,
      soporte,
      'coord',
    );
    expect(revocar).toHaveBeenCalledExactlyOnceWith(
      'ficha',
      'Corrección',
      'coord-2',
    );
  });

  it('devuelve 404 si no hay autorización activa al revocar', async () => {
    revocar.mockResolvedValue(null);
    await expect(
      service.revocar('ficha', 'Corrección', 'coord'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
