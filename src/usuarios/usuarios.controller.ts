import {
    Body,
    BadRequestException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Usuario } from '../auth/entities/usuario.entity.js';
import { RolEnum } from '../auth/enums/rol.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Gestión de cuentas de usuario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA) // Todo el módulo es exclusivo de la COORDINADORA
@ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
@ApiResponse({ status: 403, description: 'Acceso denegado por rol no autorizado' })
@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    @ApiOperation({ summary: 'Crear una cuenta de usuario con rol asignado' })
    @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente' })
    @ApiResponse({ status: 400, description: 'Los datos enviados no son válidos' })
    @ApiResponse({ status: 409, description: 'El correo ya existe' })
    create(@Body() dto: CreateUsuarioDto) {
        return this.usuariosService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar cuentas (paginado, con filtros)' })
    findAll(@Query() query: QueryUsuariosDto) {
        return this.usuariosService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Consultar una cuenta por id' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usuariosService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar nombre, correo o rol de una cuenta' })
    @ApiResponse({ status: 400, description: 'Debes enviar datos válidos para actualizar' })
    @ApiResponse({ status: 409, description: 'Correo repetido o última coordinadora' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUsuarioDto,
        @Req() req: { user: Usuario },
    ) {
        if (
            !dto ||
            Object.keys(dto).length === 0 ||
            Object.values(dto).some((value) => value === null)
        ) {
            throw new BadRequestException(
                'Debes enviar al menos un campo para actualizar',
            );
        }
        return this.usuariosService.update(id, dto, req.user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar lógicamente una cuenta de usuario' })
    @ApiResponse({ status: 204, description: 'Cuenta eliminada exitosamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @ApiResponse({ status: 409, description: 'No se puede eliminar la última coordinadora activa' })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: { user: Usuario },
    ) {
        return this.usuariosService.remove(id, req.user.id);
    }

    @Patch(':id/desactivar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Desactivar una cuenta (baja lógica)' })
    desactivar(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: { user: Usuario },
    ) {
        return this.usuariosService.desactivar(id, req.user.id);
    }

    @Patch(':id/activar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reactivar una cuenta desactivada' })
    activar(@Param('id', ParseUUIDPipe) id: string) {
        return this.usuariosService.activar(id);
    }

    @Patch(':id/password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer la contraseña de una cuenta' })
    resetPassword(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ResetPasswordDto,
    ) {
        return this.usuariosService.resetPassword(id, dto);
    }
}