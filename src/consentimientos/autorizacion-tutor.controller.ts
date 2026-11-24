import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { AutorizacionTutorService } from './application/autorizacion-tutor.service.js';
import {
  MAX_SOPORTE_TUTOR_BYTES,
  type SoporteTutor,
} from './domain/autorizacion-tutor.js';
import {
  AutorizacionTutorRespuestaDto,
  RegistrarAutorizacionTutorDto,
  RegistrarTutorMultipartDto,
  RevocarAutorizacionTutorDto,
} from './dto/autorizacion-tutor.dto.js';

type Solicitud = { user: { id: string } };

@ApiTags('Consentimientos')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiBadRequestResponse()
@ApiNotFoundResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA)
@Controller('beneficiarios/:id/autorizacion-tutor')
export class AutorizacionTutorController {
  constructor(private readonly servicio: AutorizacionTutorService) {}

  @Post()
  @ApiOperation({
    summary: 'Aprobar el soporte firmado del tutor legal (RF-21)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegistrarTutorMultipartDto })
  @ApiCreatedResponse({ type: AutorizacionTutorRespuestaDto })
  @ApiConflictResponse({
    description: 'Beneficiario mayor de edad o autorización de tutor ya activa',
  })
  @ApiResponse({ status: 413, description: 'El soporte supera 5 MiB' })
  @UseInterceptors(
    FileInterceptor('soporte', {
      limits: {
        fileSize: MAX_SOPORTE_TUTOR_BYTES + 1,
        files: 1,
        fields: 5,
        fieldSize: 1024,
      },
    }),
  )
  registrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: RegistrarAutorizacionTutorDto,
    @UploadedFile() soporte: SoporteTutor | undefined,
    @Req() { user }: Solicitud,
  ) {
    return this.servicio.registrar(id, datos, soporte, user.id);
  }

  @Post('revocacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Revocar la autorización del tutor y retirar su permiso de imagen (RF-21)',
  })
  @ApiOkResponse({ type: AutorizacionTutorRespuestaDto })
  revocar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { motivo }: RevocarAutorizacionTutorDto,
    @Req() { user }: Solicitud,
  ) {
    return this.servicio.revocar(id, motivo, user.id);
  }
}
