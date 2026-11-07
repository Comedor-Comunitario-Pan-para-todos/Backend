import {
    ConflictException,
    Injectable,
    NotFoundException,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { Rol } from './entities/rol.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { RolEnum } from './enums/rol.enum.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @InjectRepository(Rol)
        private readonly rolRepository: Repository<Rol>,
        private readonly jwtService: JwtService,
    ) { }

    // Se ejecuta al arrancar el backend para sembrar los roles iniciales si no existen
    async onModuleInit() {
        for (const rolNombre of Object.values(RolEnum)) {
            const existe = await this.rolRepository.findOne({
                where: { nombre: rolNombre },
            });
            if (!existe) {
                await this.rolRepository.save(
                    this.rolRepository.create({
                        nombre: rolNombre,
                        descripcion: `Rol de ${rolNombre}`,
                    }),
                );
            }
        }
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Buscamos al usuario incluyendo la contraseña oculta (select: false)
        const usuario = await this.usuarioRepository
            .createQueryBuilder('usuario')
            .addSelect('usuario.password')
            .leftJoinAndSelect('usuario.rol', 'rol')
            .where('usuario.email = :email', { email })
            .getOne();

        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!usuario.activo) {
            throw new UnauthorizedException('El usuario se encuentra inactivo');
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const payload: JwtPayload = {
            sub: usuario.id,
            email: usuario.email,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombreCompleto: usuario.nombreCompleto,
                rol: usuario.rol.nombre,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const { email, password, nombreCompleto, rol } = registerDto;

        const existeUsuario = await this.usuarioRepository.findOne({
            where: { email },
        });
        if (existeUsuario) {
            throw new ConflictException(
                'Ya existe un usuario con este correo electrónico',
            );
        }

        const rolEntity = await this.rolRepository.findOne({
            where: { nombre: rol },
        });
        if (!rolEntity) {
            throw new NotFoundException(`El rol ${rol} no existe en el sistema`);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = this.usuarioRepository.create({
            email,
            password: hashedPassword,
            nombreCompleto,
            rol: rolEntity,
        });

        const guardado = await this.usuarioRepository.save(nuevoUsuario);

        return {
            id: guardado.id,
            email: guardado.email,
            nombreCompleto: guardado.nombreCompleto,
            rol: rolEntity.nombre,
        };
    }
}