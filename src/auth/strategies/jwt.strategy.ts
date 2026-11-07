import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity.js';

export interface JwtPayload {
    sub: string;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:
                configService.get<string>('JWT_SECRET') ||
                'super_clave_secreta_comedor_2026',
        });
    }

    async validate(payload: JwtPayload): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({
            where: { id: payload.sub, activo: true },
            relations: { rol: true },
        });

        if (!usuario) {
            throw new UnauthorizedException(
                'Token inválido o el usuario no está activo',
            );
        }

        return usuario;
    }
}