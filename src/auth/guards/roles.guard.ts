import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { RolEnum } from '../enums/rol.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RolEnum[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Si el endpoint no tiene el decorador @Roles, se permite el acceso
        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.rol) {
            throw new ForbiddenException(
                'No tiene permisos para acceder a este recurso',
            );
        }

        const hasRole = requiredRoles.includes(user.rol.nombre);
        if (!hasRole) {
            throw new ForbiddenException(
                `Acceso denegado: Se requiere uno de los roles [${requiredRoles.join(', ')}]`,
            );
        }

        return true;
    }
}