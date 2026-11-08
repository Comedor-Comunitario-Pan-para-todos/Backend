import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolEnum } from '../auth/enums/rol.enum.js';
import { UsuariosService } from './usuarios.service.js';

const rolCoordinadora = { id: 1, nombre: RolEnum.COORDINADORA };
const rolVoluntario = { id: 3, nombre: RolEnum.VOLUNTARIO };

const crearUsuario = (overrides: Record<string, unknown> = {}) => ({
    id: 'uuid-1',
    email: 'ana@comedor.org',
    nombreCompleto: 'Ana Gómez',
    activo: true,
    rol: rolVoluntario,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const errorCorreoDuplicado = () =>
    new QueryFailedError(
        'INSERT INTO usuarios',
        [],
        Object.assign(new Error('Duplicate entry'), {
            code: 'ER_DUP_ENTRY',
            errno: 1062,
        }),
    );

// Query builder falso: registra las llamadas y devuelve [usuarios, total]
const crearQueryBuilder = (resultado: [unknown[], number]) => ({
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn().mockResolvedValue(resultado),
});

describe('UsuariosService', () => {
    let service: UsuariosService;

    const usuarioRepo = {
        findOne: vi.fn(),
        count: vi.fn(),
        create: vi.fn((dto: any) => dto),
        save: vi.fn((entity: any) => Promise.resolve({ id: 'uuid-nuevo', ...entity })),
        update: vi.fn(),
        softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: vi.fn(),
    };
    const rolRepo = { findOne: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        usuarioRepo.save.mockImplementation((entity: any) =>
            Promise.resolve({ id: 'uuid-nuevo', ...entity }),
        );
        usuarioRepo.create.mockImplementation((dto: any) => dto);
        service = new UsuariosService(usuarioRepo as any, rolRepo as any);
    });

    describe('create', () => {
        const dto = {
            email: 'nuevo@comedor.org',
            password: 'Clave1234*',
            nombreCompleto: 'Nuevo Usuario',
            rol: RolEnum.VOLUNTARIO,
        };

        it('crea la cuenta con la contraseña hasheada y sin exponerla', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            rolRepo.findOne.mockResolvedValue(rolVoluntario);

            const resultado = await service.create(dto);

            const guardado = usuarioRepo.save.mock.calls[0][0];
            expect(guardado.password).not.toBe(dto.password);
            expect(await bcrypt.compare(dto.password, guardado.password)).toBe(true);
            expect(resultado).not.toHaveProperty('password');
            expect(resultado.rol).toBe(RolEnum.VOLUNTARIO);
        });

        it('asigna el rol pedido y busca el correo antes de guardar', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            rolRepo.findOne.mockResolvedValue(rolVoluntario);

            await service.create(dto);

            expect(usuarioRepo.findOne).toHaveBeenCalledWith({
                where: { email: dto.email },
            });
            expect(rolRepo.findOne).toHaveBeenCalledWith({
                where: { nombre: RolEnum.VOLUNTARIO },
            });
            expect(usuarioRepo.save.mock.calls[0][0]).toMatchObject({
                email: dto.email,
                nombreCompleto: dto.nombreCompleto,
                rol: rolVoluntario,
            });
        });

        it('rechaza un correo ya registrado y no guarda nada', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());
            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('convierte una colisión de correo al guardar en 409', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            rolRepo.findOne.mockResolvedValue(rolVoluntario);
            usuarioRepo.save.mockRejectedValueOnce(errorCorreoDuplicado());

            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
        });

        it('falla si el rol no existe en la base de datos', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            rolRepo.findOne.mockResolvedValue(null);
            await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('sin filtros no agrega condiciones y calcula la paginación', async () => {
            const qb = crearQueryBuilder([[crearUsuario(), crearUsuario({ id: 'uuid-2' })], 25]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            const resultado = await service.findAll({ page: 1, limit: 10 });

            expect(qb.andWhere).not.toHaveBeenCalled();
            expect(qb.skip).toHaveBeenCalledWith(0);
            expect(qb.take).toHaveBeenCalledWith(10);
            expect(resultado.data).toHaveLength(2);
            expect(resultado.meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 });
        });

        it('salta los registros de las páginas anteriores', async () => {
            const qb = crearQueryBuilder([[], 0]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ page: 3, limit: 5 });

            expect(qb.skip).toHaveBeenCalledWith(10);
            expect(qb.take).toHaveBeenCalledWith(5);
        });

        it('aplica búsqueda, rol y estado cuando vienen en la consulta', async () => {
            const qb = crearQueryBuilder([[], 0]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({
                page: 1,
                limit: 10,
                search: 'ana',
                rol: RolEnum.VOLUNTARIO,
                activo: true,
            });

            expect(qb.andWhere).toHaveBeenCalledTimes(3);
            expect(qb.andWhere).toHaveBeenCalledWith(
                expect.stringContaining("LIKE :search ESCAPE '!'"),
                { search: '%ana%' },
            );
            expect(qb.andWhere).toHaveBeenCalledWith('rol.nombre = :rol', {
                rol: RolEnum.VOLUNTARIO,
            });
            expect(qb.andWhere).toHaveBeenCalledWith('usuario.activo = :activo', {
                activo: true,
            });
        });

        it('escapa los comodines de LIKE para buscar el texto literalmente', async () => {
            const qb = crearQueryBuilder([[], 0]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ page: 1, limit: 10, search: '%_!' });

            expect(qb.andWhere).toHaveBeenCalledWith(
                expect.stringContaining("LIKE :search ESCAPE '!'"),
                { search: '%!%!_!!%' },
            );
        });

        it('filtra por cuentas inactivas (activo=false no se ignora)', async () => {
            const qb = crearQueryBuilder([[], 0]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ page: 1, limit: 10, activo: false });

            expect(qb.andWhere).toHaveBeenCalledWith('usuario.activo = :activo', {
                activo: false,
            });
        });

        it('nunca expone el hash de la contraseña', async () => {
            const qb = crearQueryBuilder([[crearUsuario({ password: 'hash-secreto' })], 1]);
            usuarioRepo.createQueryBuilder.mockReturnValue(qb);

            const resultado = await service.findAll({ page: 1, limit: 10 });

            expect(resultado.data[0]).not.toHaveProperty('password');
            expect(resultado.data[0].rol).toBe(RolEnum.VOLUNTARIO);
        });
    });

    describe('findOne', () => {
        it('devuelve la cuenta sin la contraseña', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario({ password: 'hash-secreto' }));

            const resultado = await service.findOne('uuid-1');

            expect(resultado.email).toBe('ana@comedor.org');
            expect(resultado.rol).toBe(RolEnum.VOLUNTARIO);
            expect(resultado).not.toHaveProperty('password');
        });

        it('lanza 404 si no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('uuid-x')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('update', () => {
        it('lanza 404 si la cuenta no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            await expect(
                service.update('uuid-x', { nombreCompleto: 'Otro' }, 'actor'),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('actualiza nombre y correo cuando el correo está libre', async () => {
            usuarioRepo.findOne
                .mockResolvedValueOnce(crearUsuario())
                .mockResolvedValueOnce(null);

            const resultado = await service.update(
                'uuid-1',
                { nombreCompleto: 'Ana María', email: 'nuevo@comedor.org' },
                'actor',
            );

            expect(resultado.nombreCompleto).toBe('Ana María');
            expect(resultado.email).toBe('nuevo@comedor.org');
            expect(usuarioRepo.save).toHaveBeenCalledOnce();
        });

        it('no revisa duplicados si el correo no cambió', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());

            await service.update('uuid-1', { email: 'ana@comedor.org' }, 'actor');

            expect(usuarioRepo.findOne).toHaveBeenCalledTimes(1);
        });

        it('permite editar el propio nombre', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'yo', rol: rolCoordinadora }),
            );

            const resultado = await service.update('yo', { nombreCompleto: 'Nuevo' }, 'yo');

            expect(resultado.nombreCompleto).toBe('Nuevo');
        });

        it('cambia el rol de una cuenta que no es coordinadora', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());
            rolRepo.findOne.mockResolvedValue(rolCoordinadora);

            const resultado = await service.update(
                'uuid-1',
                { rol: RolEnum.COORDINADORA },
                'actor',
            );

            expect(resultado.rol).toBe(RolEnum.COORDINADORA);
            expect(usuarioRepo.count).not.toHaveBeenCalled();
        });

        it('falla si el rol destino no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());
            rolRepo.findOne.mockResolvedValue(null);

            await expect(
                service.update('uuid-1', { rol: RolEnum.DONANTE }, 'actor'),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('no permite cambiar el propio rol', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'yo', rol: rolCoordinadora }),
            );
            await expect(
                service.update('yo', { rol: RolEnum.VOLUNTARIO }, 'yo'),
            ).rejects.toBeInstanceOf(BadRequestException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('no deja degradar a la última coordinadora activa', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'otra', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(0);
            await expect(
                service.update('otra', { rol: RolEnum.VOLUNTARIO }, 'actor'),
            ).rejects.toBeInstanceOf(ConflictException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('sí deja degradar a una coordinadora si queda otra activa', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'otra', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(1);
            rolRepo.findOne.mockResolvedValue(rolVoluntario);

            const resultado = await service.update(
                'otra',
                { rol: RolEnum.VOLUNTARIO },
                'actor',
            );

            expect(resultado.rol).toBe(RolEnum.VOLUNTARIO);
        });

        it('al contar coordinadoras restantes excluye a la cuenta editada y solo cuenta activas', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'otra', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(1);
            rolRepo.findOne.mockResolvedValue(rolVoluntario);

            await service.update('otra', { rol: RolEnum.VOLUNTARIO }, 'actor');

            const { where } = usuarioRepo.count.mock.calls[0][0];
            expect(where.activo).toBe(true);
            expect(where.rol).toEqual({ nombre: RolEnum.COORDINADORA });
            // Not('otra'): el operador de TypeORM guarda el valor excluido
            expect(where.id.value).toBe('otra');
        });

        it('rechaza un correo que ya usa otra cuenta', async () => {
            usuarioRepo.findOne
                .mockResolvedValueOnce(crearUsuario())
                .mockResolvedValueOnce(crearUsuario({ id: 'uuid-2' }));
            await expect(
                service.update('uuid-1', { email: 'repetido@comedor.org' }, 'actor'),
            ).rejects.toBeInstanceOf(ConflictException);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('convierte una colisión de correo durante la edición en 409', async () => {
            usuarioRepo.findOne
                .mockResolvedValueOnce(crearUsuario())
                .mockResolvedValueOnce(null);
            usuarioRepo.save.mockRejectedValueOnce(errorCorreoDuplicado());

            await expect(
                service.update(
                    'uuid-1',
                    { email: 'repetido@comedor.org' },
                    'actor',
                ),
            ).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('desactivar', () => {
        it('no permite desactivar la propia cuenta', async () => {
            await expect(service.desactivar('yo', 'yo')).rejects.toBeInstanceOf(
                BadRequestException,
            );
            expect(usuarioRepo.findOne).not.toHaveBeenCalled();
        });

        it('lanza 404 si la cuenta no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            await expect(service.desactivar('uuid-x', 'actor')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('no deja sin coordinadora activa al sistema', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'otra', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(0);
            await expect(service.desactivar('otra', 'actor')).rejects.toBeInstanceOf(
                ConflictException,
            );
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });

        it('desactiva a una coordinadora si queda otra activa', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'otra', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(1);

            const resultado = await service.desactivar('otra', 'actor');

            expect(resultado.activo).toBe(false);
        });

        it('desactiva una cuenta normal sin contar coordinadoras', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());

            const resultado = await service.desactivar('uuid-1', 'actor');

            expect(resultado.activo).toBe(false);
            expect(usuarioRepo.count).not.toHaveBeenCalled();
        });

        it('si ya estaba inactiva no vuelve a guardar', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario({ activo: false }));

            const resultado = await service.desactivar('uuid-1', 'actor');

            expect(resultado.activo).toBe(false);
            expect(usuarioRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('activar', () => {
        it('reactiva una cuenta inactiva', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario({ activo: false }));

            const resultado = await service.activar('uuid-1');

            expect(resultado.activo).toBe(true);
            expect(usuarioRepo.save).toHaveBeenCalledOnce();
        });

        it('lanza 404 si la cuenta no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            await expect(service.activar('uuid-x')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('remove', () => {
        it('no permite eliminar la propia cuenta', async () => {
            await expect(service.remove('yo', 'yo')).rejects.toBeInstanceOf(
                BadRequestException,
            );
            expect(usuarioRepo.findOne).not.toHaveBeenCalled();
            expect(usuarioRepo.softDelete).not.toHaveBeenCalled();
        });

        it('lanza 404 si la cuenta no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('uuid-x', 'actor')).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(usuarioRepo.softDelete).not.toHaveBeenCalled();
        });

        it('marca la cuenta para borrado lógico', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());

            await expect(service.remove('uuid-1', 'actor')).resolves.toBeUndefined();

            expect(usuarioRepo.softDelete).toHaveBeenCalledWith('uuid-1');
        });

        it('no elimina a la última coordinadora activa', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'coord', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(0);

            await expect(service.remove('coord', 'actor')).rejects.toBeInstanceOf(
                ConflictException,
            );
            expect(usuarioRepo.softDelete).not.toHaveBeenCalled();
        });

        it('elimina una coordinadora si queda otra activa', async () => {
            usuarioRepo.findOne.mockResolvedValue(
                crearUsuario({ id: 'coord', rol: rolCoordinadora }),
            );
            usuarioRepo.count.mockResolvedValue(1);

            await service.remove('coord', 'actor');

            expect(usuarioRepo.softDelete).toHaveBeenCalledWith('coord');
        });

        it('lanza 404 si no se afectó ninguna fila', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());
            usuarioRepo.softDelete.mockResolvedValueOnce({ affected: 0 });

            await expect(service.remove('uuid-1', 'actor')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('resetPassword', () => {
        it('guarda la nueva contraseña hasheada', async () => {
            usuarioRepo.findOne.mockResolvedValue(crearUsuario());
            await service.resetPassword('uuid-1', { nuevaPassword: 'OtraClave123*' });

            const [id, cambios] = usuarioRepo.update.mock.calls[0];
            expect(id).toBe('uuid-1');
            expect(cambios.password).not.toBe('OtraClave123*');
            expect(await bcrypt.compare('OtraClave123*', cambios.password)).toBe(true);
        });

        it('lanza 404 y no actualiza si la cuenta no existe', async () => {
            usuarioRepo.findOne.mockResolvedValue(null);
            await expect(
                service.resetPassword('uuid-x', { nuevaPassword: 'OtraClave123*' }),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect(usuarioRepo.update).not.toHaveBeenCalled();
        });
    });
});