import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import {
  CadenaFrioService,
  EquipoNoDisponibleError,
} from './application/cadena-frio.service.js';
import {
  CrearIncidenteDto,
  EquipoRefrigeracionDto,
  IncidenteDto,
} from './dto/incidente.dto.js';

@ApiTags('Cadena de frío')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CadenaFrioController {
  constructor(private readonly service: CadenaFrioService) {}

  @Get('equipos-refrigeracion')
  @Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA)
  @ApiOkResponse({ type: [EquipoRefrigeracionDto] })
  listarEquipos(@Req() { user }: { user: { id: string } }) {
    return this.service.listarEquipos(user.id);
  }

  @Post('incidentes-cadena-frio')
  @Roles(RolEnum.VOLUNTARIO)
  @ApiCreatedResponse({ type: IncidenteDto })
  @ApiBadRequestResponse({ description: 'Reporte inválido' })
  @ApiNotFoundResponse({ description: 'Equipo inexistente o inactivo' })
  async registrar(
    @Body() reporte: CrearIncidenteDto,
    @Req() { user }: { user: { id: string } },
  ) {
    try {
      return await this.service.registrar(reporte, user.id);
    } catch (error) {
      if (error instanceof EquipoNoDisponibleError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
