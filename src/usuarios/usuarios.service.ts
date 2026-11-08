import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { Rol } from '../auth/entities/rol.entity.js';
import { Usuario } from '../auth/entities/usuario.entity.js';
import { RolEnum } from '../auth/enums/rol.enum.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @InjectRepository(Rol)
        private readonly rolRepository: Repository<Rol>,
    ) { }

    async create(dto: CreateUsuarioDto) {
        await this.assertEmailDisponible(dto.email);
        const rol = await this.obtenerRol(dto.rol);

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const usuario = this.usuarioRepository.create({
            email: dto.email,
            password: hashedPassword,
            nombreCompleto: dto.nombreCompleto,
            rol,
        });

        return this.toResponse(await this.saveUsuario(usuario));
    }

    async findAll(query: QueryUsuariosDto) {
        const { page, limit, search, rol, activo } = query;

        const qb = this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoinAndSelect('usuario.rol', 'rol');

        if (search) {
            const searchLiteral = search.replace(/[!%_]/g, '!$&');
            qb.andWhere(
                "(usuario.nombreCompleto LIKE :search ESCAPE '!' OR usuario.email LIKE :search ESCAPE '!')",
                { search: `%${searchLiteral}%` },
            );
        }
        if (rol) {
            qb.andWhere('rol.nombre = :rol', { rol });
        }
        if (activo !== undefined) {
            qb.andWhere('usuario.activo = :activo', { activo });
        }

        const [usuarios, total] = await qb
            .orderBy('usuario.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: usuarios.map((u) => this.toResponse(u)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        return this.toResponse(await this.obtenerUsuario(id));
    }

    async update(id: string, dto: UpdateUsuarioDto, actorId: string) {
        const usuario = await this.obtenerUsuario(id);

        if (dto.email && dto.email !== usuario.email) {
            await this.assertEmailDisponible(dto.email);
            usuario.email = dto.email;
        }

        if (dto.nombreCompleto) {
            usuario.nombreCompleto = dto.nombreCompleto;
        }

        if (dto.rol && dto.rol !== usuario.rol.nombre) {
            if (id === actorId) {
                throw new BadRequestException('No puedes cambiar tu propio rol');
            }
            if (usuario.rol.nombre === RolEnum.COORDINADORA && usuario.activo) {
                await this.assertQuedaOtraCoordinadora(usuario.id);
            }
            usuario.rol = await this.obtenerRol(dto.rol);
        }

        return this.toResponse(await this.saveUsuario(usuario));
    }

    // Baja lógica: la cuenta se conserva para mantener el historial/trazabilidad
    async desactivar(id: string, actorId: string) {
        if (id === actorId) {
            throw new BadRequestException('No puedes desactivar tu propia cuenta');
        }

        const usuario = await this.obtenerUsuario(id);
        if (!usuario.activo) {
            return this.toResponse(usuario);
        }

        if (usuario.rol.nombre === RolEnum.COORDINADORA) {
            await this.assertQuedaOtraCoordinadora(usuario.id);
        }

        usuario.activo = false;
        return this.toResponse(await this.usuarioRepository.save(usuario));
    }

    async remove(id: string, actorId: string): Promise<void> {
        if (id === actorId) {
            throw new BadRequestException('No puedes eliminar tu propia cuenta');
        }

        const usuario = await this.obtenerUsuario(id);
        if (
            usuario.activo &&
            usuario.rol.nombre === RolEnum.COORDINADORA
        ) {
            await this.assertQuedaOtraCoordinadora(usuario.id);
        }

        const resultado = await this.usuarioRepository.softDelete(usuario.id);
        if (resultado.affected === 0) {
            throw new NotFoundException('Usuario no encontrado');
        }
    }

    async activar(id: string) {
        const usuario = await this.obtenerUsuario(id);
        usuario.activo = true;
        return this.toResponse(await this.usuarioRepository.save(usuario));
    }

    async resetPassword(id: string, dto: ResetPasswordDto) {
        const usuario = await this.obtenerUsuario(id);
        const hashedPassword = await bcrypt.hash(dto.nuevaPassword, 10);
        await this.usuarioRepository.update(usuario.id, {
            password: hashedPassword,
        });
        return { mensaje: 'Contraseña actualizada correctamente' };
    }

    // ---------- helpers ----------

    private async obtenerUsuario(id: string): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({
            where: { id },
            relations: { rol: true },
        });
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return usuario;
    }

    private async obtenerRol(nombre: RolEnum): Promise<Rol> {
        const rol = await this.rolRepository.findOne({ where: { nombre } });
        if (!rol) {
            throw new NotFoundException(`El rol ${nombre} no existe en el sistema`);
        }
        return rol;
    }

    private async assertEmailDisponible(email: string) {
        const existe = await this.usuarioRepository.findOne({ where: { email } });
        if (existe) {
            throw new ConflictException(
                'Ya existe un usuario con este correo electrónico',
            );
        }
    }

    private async saveUsuario(usuario: Usuario): Promise<Usuario> {
        try {
            return await this.usuarioRepository.save(usuario);
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                error.driverError?.code === 'ER_DUP_ENTRY'
            ) {
                throw new ConflictException(
                    'Ya existe un usuario con este correo electrónico',
                );
            }
            throw error;
        }
    }

    // Evita dejar el sistema sin ninguna COORDINADORA activa
    private async assertQuedaOtraCoordinadora(excluirId: string) {
        const otras = await this.usuarioRepository.count({
            where: {
                id: Not(excluirId),
                activo: true,
                rol: { nombre: RolEnum.COORDINADORA },
            },
        });
        if (otras === 0) {
            throw new ConflictException(
                'Debe existir al menos una COORDINADORA activa en el sistema',
            );
        }
    }

    // Nunca exponemos el hash de la contraseña
    private toResponse(usuario: Usuario) {
        return {
            id: usuario.id,
            email: usuario.email,
            nombreCompleto: usuario.nombreCompleto,
            rol: usuario.rol.nombre,
            activo: usuario.activo,
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt,
        };
    }
}