import {
    ConflictException,
    ExecutionContext,
    INestApplication,
    UnauthorizedException,
    ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import { RolEnum } from '../auth/enums/rol.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

const ID = '3f2b8c1e-5a4d-4b7e-9c1a-2d8e6f0a1b34';
const ID_COORDINADORA = '9a1c7d52-0b3e-4f6a-8d2b-5e7c9f1a3b46';

const coordinadora = { id: ID_COORDINADORA, rol: { nombre: RolEnum.COORDINADORA } };
const voluntario = { id: 'otro-id', rol: { nombre: RolEnum.VOLUNTARIO } };

describe('UsuariosController (HTTP)', () => {
    let app: INestApplication;

    // Simula al usuario que "viene" del token JWT. null = sin token.
    let usuarioActual: typeof coordinadora | null;

    const jwtGuardFalso = {
        canActivate: (context: ExecutionContext) => {
            if (!usuarioActual) {
                throw new UnauthorizedException();
            }
            context.switchToHttp().getRequest().user = usuarioActual;
            return true;
        },
    };

    const usuariosService = {
        create: vi.fn(),
        findAll: vi.fn(),
        findOne: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        desactivar: vi.fn(),
        activar: vi.fn(),
        resetPassword: vi.fn(),
    };

    beforeAll(async () => {
        // JwtAuthGuard se reemplaza por uno falso; RolesGuard es el REAL,
        // así comprobamos que de verdad bloquea a quien no es COORDINADORA
        const moduleRef = await Test.createTestingModule({
            controllers: [UsuariosController],
            providers: [{ provide: UsuariosService, useValue: usuariosService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(jwtGuardFalso)
            .compile();

        app = moduleRef.createNestApplication();
        // Mismas validaciones globales que en main.ts
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        usuarioActual = coordinadora;
        usuariosService.create.mockResolvedValue({ id: ID });
        usuariosService.findAll.mockResolvedValue({ data: [], meta: {} });
        usuariosService.findOne.mockResolvedValue({ id: ID });
        usuariosService.update.mockResolvedValue({ id: ID });
        usuariosService.remove.mockResolvedValue(undefined);
        usuariosService.desactivar.mockResolvedValue({ id: ID, activo: false });
        usuariosService.activar.mockResolvedValue({ id: ID, activo: true });
        usuariosService.resetPassword.mockResolvedValue({ mensaje: 'ok' });
    });

    describe('seguridad', () => {
        it('todo el controlador exige el rol COORDINADORA', () => {
            expect(Reflect.getMetadata(ROLES_KEY, UsuariosController)).toEqual([
                RolEnum.COORDINADORA,
            ]);
        });

        it('responde 401 si no hay sesión', async () => {
            usuarioActual = null;
            await request(app.getHttpServer()).get('/usuarios').expect(401);
            expect(usuariosService.findAll).not.toHaveBeenCalled();
        });

        it.each([
            ['GET', '/usuarios'],
            ['POST', '/usuarios'],
            ['GET', `/usuarios/${ID}`],
            ['PATCH', `/usuarios/${ID}`],
            ['DELETE', `/usuarios/${ID}`],
            ['PATCH', `/usuarios/${ID}/desactivar`],
            ['PATCH', `/usuarios/${ID}/activar`],
            ['PATCH', `/usuarios/${ID}/password`],
        ])('responde 403 a un VOLUNTARIO en %s %s', async (metodo, ruta) => {
            usuarioActual = voluntario;
            const req = request(app.getHttpServer());
            const respuesta = metodo === 'GET'
                ? await req.get(ruta)
                : metodo === 'POST'
                    ? await req.post(ruta).send({})
                    : metodo === 'DELETE'
                        ? await req.delete(ruta)
                        : await req.patch(ruta).send({});

            expect(respuesta.status).toBe(403);
            for (const fn of Object.values(usuariosService)) {
                expect(fn).not.toHaveBeenCalled();
            }
        });
    });

    describe('POST /usuarios', () => {
        const valido = {
            email: 'ana@comedor.org',
            password: 'Clave1234*',
            nombreCompleto: 'Ana Gómez',
            rol: RolEnum.VOLUNTARIO,
        };

        it('crea la cuenta y responde 201', async () => {
            await request(app.getHttpServer()).post('/usuarios').send(valido).expect(201);
            expect(usuariosService.create).toHaveBeenCalledWith(valido);
        });

        it('acepta un nombre de 255 caracteres', async () => {
            const nombreCompleto = 'A'.repeat(255);
            await request(app.getHttpServer())
                .post('/usuarios')
                .send({ ...valido, nombreCompleto })
                .expect(201);
            expect(usuariosService.create).toHaveBeenCalledWith({
                ...valido,
                nombreCompleto,
            });
        });

        it('normaliza el correo y recorta el nombre antes de crear', async () => {
            await request(app.getHttpServer())
                .post('/usuarios')
                .send({ ...valido, email: '  ANA@Comedor.ORG ', nombreCompleto: '  Ana Gómez ' })
                .expect(201);
            expect(usuariosService.create).toHaveBeenCalledWith(valido);
        });

        it.each([
            ['correo inválido', { email: 'no-es-correo' }],
            ['contraseña de menos de 8 caracteres', { password: '1234567' }],
            ['rol inexistente', { rol: 'SUPERADMIN' }],
            ['nombre vacío', { nombreCompleto: '' }],
            ['nombre de más de 255 caracteres', { nombreCompleto: 'A'.repeat(256) }],
            ['campo no permitido', { esAdmin: true }],
        ])('responde 400 con %s', async (_caso, cambio) => {
            await request(app.getHttpServer())
                .post('/usuarios')
                .send({ ...valido, ...cambio })
                .expect(400);
            expect(usuariosService.create).not.toHaveBeenCalled();
        });

        it('responde 409 cuando el servicio detecta un correo repetido', async () => {
            usuariosService.create.mockRejectedValue(new ConflictException('repetido'));
            await request(app.getHttpServer()).post('/usuarios').send(valido).expect(409);
        });
    });

    describe('GET /usuarios', () => {
        it('usa page=1 y limit=10 por defecto', async () => {
            await request(app.getHttpServer()).get('/usuarios').expect(200);
            expect(usuariosService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1, limit: 10 }),
            );
        });

        it('convierte los filtros de la query a sus tipos reales', async () => {
            await request(app.getHttpServer())
                .get('/usuarios?page=2&limit=5&search=ana&rol=VOLUNTARIO&activo=false')
                .expect(200);
            expect(usuariosService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    limit: 5,
                    search: 'ana',
                    rol: RolEnum.VOLUNTARIO,
                    activo: false,
                }),
            );
        });

        it.each(['limit=1000', 'limit=0', 'page=0', 'rol=SUPERADMIN', 'activo=talvez'])(
            'responde 400 con la query inválida %s',
            async (query) => {
                await request(app.getHttpServer()).get(`/usuarios?${query}`).expect(400);
                expect(usuariosService.findAll).not.toHaveBeenCalled();
            },
        );
    });

    describe('GET /usuarios/:id', () => {
        it('responde 400 si el id no es un UUID', async () => {
            await request(app.getHttpServer()).get('/usuarios/123').expect(400);
            expect(usuariosService.findOne).not.toHaveBeenCalled();
        });

        it('consulta la cuenta con un UUID válido', async () => {
            await request(app.getHttpServer()).get(`/usuarios/${ID}`).expect(200);
            expect(usuariosService.findOne).toHaveBeenCalledWith(ID);
        });
    });

    describe('PATCH /usuarios/:id', () => {
        it('responde 400 cuando el cuerpo está vacío', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({})
                .expect(400);
            expect(usuariosService.update).not.toHaveBeenCalled();
        });

        describe('DELETE /usuarios/:id', () => {
            it('elimina lógicamente la cuenta y responde 204', async () => {
                await request(app.getHttpServer())
                    .delete(`/usuarios/${ID}`)
                    .expect(204);

                expect(usuariosService.remove).toHaveBeenCalledWith(
                    ID,
                    ID_COORDINADORA,
                );
            });

            it('responde 400 si el id no es un UUID', async () => {
                await request(app.getHttpServer())
                    .delete('/usuarios/no-es-uuid')
                    .expect(400);

                expect(usuariosService.remove).not.toHaveBeenCalled();
            });
        });

        it('responde 400 cuando un campo editable se envía como null', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({ nombreCompleto: null })
                .expect(400);
            expect(usuariosService.update).not.toHaveBeenCalled();
        });

        it('edita la cuenta pasando el id de quien hace la petición', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({ nombreCompleto: 'Nuevo Nombre' })
                .expect(200);
            expect(usuariosService.update).toHaveBeenCalledWith(
                ID,
                { nombreCompleto: 'Nuevo Nombre' },
                ID_COORDINADORA,
            );
        });

        it('responde 400 cuando el nombre supera 255 caracteres', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({ nombreCompleto: 'A'.repeat(256) })
                .expect(400);
            expect(usuariosService.update).not.toHaveBeenCalled();
        });

        it('no permite cambiar la contraseña por esta ruta', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({ password: 'Hackeada123*' })
                .expect(400);
            expect(usuariosService.update).not.toHaveBeenCalled();
        });

        it('no permite desactivar la cuenta por esta ruta', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}`)
                .send({ activo: false })
                .expect(400);
            expect(usuariosService.update).not.toHaveBeenCalled();
        });
    });

    describe('activar / desactivar / password', () => {
        it('desactiva pasando el id de quien hace la petición', async () => {
            await request(app.getHttpServer()).patch(`/usuarios/${ID}/desactivar`).expect(200);
            expect(usuariosService.desactivar).toHaveBeenCalledWith(ID, ID_COORDINADORA);
        });

        it('reactiva la cuenta', async () => {
            await request(app.getHttpServer()).patch(`/usuarios/${ID}/activar`).expect(200);
            expect(usuariosService.activar).toHaveBeenCalledWith(ID);
        });

        it('restablece la contraseña', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}/password`)
                .send({ nuevaPassword: 'NuevaClave123*' })
                .expect(200);
            expect(usuariosService.resetPassword).toHaveBeenCalledWith(ID, {
                nuevaPassword: 'NuevaClave123*',
            });
        });

        it('responde 400 si la nueva contraseña es muy corta', async () => {
            await request(app.getHttpServer())
                .patch(`/usuarios/${ID}/password`)
                .send({ nuevaPassword: 'corta' })
                .expect(400);
            expect(usuariosService.resetPassword).not.toHaveBeenCalled();
        });
    });
});