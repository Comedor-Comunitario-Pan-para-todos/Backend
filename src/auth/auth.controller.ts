import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Roles } from './decorators/roles.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RolEnum } from './enums/rol.enum.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@ApiTags('Autenticación y Roles')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
    @ApiResponse({ status: 200, description: 'Login exitoso' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Registrar un nuevo usuario con rol asignado' })
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo ya existe' })
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
    @ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
    getProfile(@Req() req: any) {
        const usuario = req.user;
        return {
            id: usuario.id,
            email: usuario.email,
            nombreCompleto: usuario.nombreCompleto,
            rol: usuario.rol.nombre,
            activo: usuario.activo,
        };
    }

    // Endpoint de prueba que demuestra la restricción exclusiva para COORDINADORA
    @Get('solo-coordinadora')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolEnum.COORDINADORA)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Ruta protegida: únicamente accesible para la COORDINADORA',
    })
    @ApiResponse({ status: 200, description: 'Acceso autorizado a Coordinación' })
    @ApiResponse({ status: 403, description: 'Acceso denegado por rol no autorizado' })
    rutaCoordinadora(@Req() req: any) {
        return {
            mensaje: 'Bienvenida, Coordinadora. Acceso a funciones administrativas concedido.',
            usuario: req.user.nombreCompleto,
        };
    }

    // Endpoint accesible para VOLUNTARIOS y COORDINADORA
    @Get('operaciones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Ruta protegida para personal operativo (Coordinadora y Voluntarios)',
    })
    @ApiResponse({ status: 200, description: 'Acceso a operaciones concedido' })
    @ApiResponse({ status: 403, description: 'Acceso denegado por rol no autorizado' })
    rutaOperaciones(@Req() req: any) {
        return {
            mensaje: 'Acceso a operaciones diarias del comedor permitido.',
            usuario: req.user.nombreCompleto,
            rol: req.user.rol.nombre,
        };
    }
}