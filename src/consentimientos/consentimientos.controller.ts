import {
  Body,
  Controller,
  Param,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { ConsentimientosService } from './application/consentimientos.service.js';
import {
  ConsentimientoRegistradoDto,
  RegistrarConsentimientoDto,
} from './dto/registrar-consentimiento.dto.js';

@ApiTags('Consentimientos')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA)
@Controller('beneficiarios')
export class ConsentimientosController {
  constructor(private readonly service: ConsentimientosService) {}

  @Post(':id/consentimiento')
  @ApiOperation({
    summary: 'Registrar la aceptación explícita en una ficha existente (RF-19)',
  })
  @ApiCreatedResponse({ type: ConsentimientoRegistradoDto })
  @ApiBadRequestResponse({
    description: 'ID o datos de consentimiento inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Beneficiario inexistente o desactivado',
  })
  @ApiOkResponse({
    type: ConsentimientoRegistradoDto,
    description: 'Consentimiento de esa versión ya registrado',
  })
  async registrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarConsentimientoDto,
    @Req() { user }: { user: { id: string } },
    @Res({ passthrough: true }) response: { status(code: number): unknown },
  ) {
    const resultado = await this.service.registrar(id, dto, user.id);
    if (!resultado.creado) response.status(HttpStatus.OK);
    return resultado.consentimiento;
  }
}
