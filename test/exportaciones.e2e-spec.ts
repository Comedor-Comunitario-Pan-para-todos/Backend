import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import ExcelJS from 'exceljs';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { ExportarBeneficiariosService } from '../src/exportaciones/application/exportar-beneficiarios.service.js';
import {
  EXPORTACIONES_REPOSITORIO,
  GENERADOR_EXCEL,
} from '../src/exportaciones/domain/exportaciones.js';
import { ExportacionesController } from '../src/exportaciones/exportaciones.controller.js';
import { ExcelJsAdapter } from '../src/exportaciones/infrastructure/exceljs.adapter.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const ruta = '/exportaciones/beneficiarios.xlsx';
describe('Exportación de beneficiarios (HTTP)', () => {
  let app: INestApplication<App>;
  const repo = { buscarBeneficiarios: vi.fn(), auditar: vi.fn() };
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ExportacionesController],
      providers: [
        ExportarBeneficiariosService,
        { provide: EXPORTACIONES_REPOSITORIO, useValue: repo },
        { provide: GENERADOR_EXCEL, useClass: ExcelJsAdapter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: unknown;
          }>();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = {
            id: 'presidente',
            rol: { nombre: req.headers.authorization },
          };
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  beforeEach(() => {
    repo.buscarBeneficiarios.mockReset().mockResolvedValue([]);
    repo.auditar.mockReset().mockResolvedValue(undefined);
  });
  afterAll(async () => app?.close());

  it.each([
    { desde: '2026-02-30' },
    { desde: '2026-11-24T00:00:00Z' },
    { desde: '2026-11-25', hasta: '2026-11-24' },
    { campos: 'todo' },
  ])('rechaza filtros inválidos %j', async (filtros) => {
    await request(app.getHttpServer())
      .get(ruta)
      .set('Authorization', RolEnum.PRESIDENTE_JAC)
      .query(filtros)
      .expect(400);
    expect(repo.buscarBeneficiarios).not.toHaveBeenCalled();
  });

  it('solo permite descargar al Presidente de JAC', async () => {
    const http = request(app.getHttpServer());
    await http.get(ruta).expect(401);
    for (const rol of [
      RolEnum.COORDINADORA,
      RolEnum.VOLUNTARIO,
      RolEnum.DONANTE,
    ]) {
      await http.get(ruta).set('Authorization', rol).expect(403);
    }
    expect(repo.auditar).not.toHaveBeenCalled();
  });

  it('genera un libro sin campos extra y conserva textos con forma de fórmula', async () => {
    repo.buscarBeneficiarios.mockResolvedValue([
      { nombres: '=1+1', apellidos: 'Pérez', numeroDocumento: 'omitido' },
    ]);
    const respuesta = await request(app.getHttpServer())
      .get(ruta)
      .set('Authorization', RolEnum.PRESIDENTE_JAC)
      .query({ desde: '2026-11-24', hasta: '2026-11-24' })
      .expect('Cache-Control', 'no-store')
      .expect(
        'Content-Disposition',
        'attachment; filename="beneficiarios.xlsx"',
      )
      .expect('Content-Type', /spreadsheetml/)
      .buffer(true)
      .parse((stream, cb) => {
        const partes: Buffer[] = [];
        stream.on('data', (parte: Buffer) => partes.push(parte));
        stream.on('end', () => cb(null, Buffer.concat(partes)));
        stream.on('error', cb);
      })
      .expect(200);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(respuesta.body);
    const hoja = libro.getWorksheet('Beneficiarios')!;
    expect([hoja.getCell('A1').value, hoja.getCell('B1').value]).toEqual([
      'Nombres',
      'Apellidos',
    ]);
    expect(hoja.getCell('A2').value).toBe('=1+1');
    expect(hoja.getCell('C2').value).toBeNull();
    expect(repo.auditar).toHaveBeenCalledExactlyOnceWith('presidente', 1, {
      desde: '2026-11-24',
      hasta: '2026-11-24',
    });
  });
});
