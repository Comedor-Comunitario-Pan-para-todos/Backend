import {
  Controller,
  Get,
  Header,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProduces,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsDateString, Matches, ValidateIf } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { ExportarBeneficiariosService } from './application/exportar-beneficiarios.service.js';

const XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

class ConsultaExportacionDto {
  @ApiPropertyOptional({
    format: 'date',
    description: 'Primer día de autorización, inclusive, en hora colombiana',
  })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @Matches(FECHA)
  @IsDateString({ strict: true })
  desde?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Último día de autorización, inclusive, en hora colombiana',
  })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @Matches(FECHA)
  @IsDateString({ strict: true })
  hasta?: string;
}

@ApiTags('Exportaciones')
@ApiBearerAuth()
@ApiBadRequestResponse()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.PRESIDENTE_JAC)
@Controller('exportaciones')
export class ExportacionesController {
  constructor(private readonly servicio: ExportarBeneficiariosService) {}

  @Get('beneficiarios.xlsx')
  @Header('Cache-Control', 'no-store')
  @ApiProduces(XLSX)
  @ApiOkResponse({
    schema: { type: 'string', format: 'binary' },
    headers: {
      'Content-Disposition': {
        schema: {
          type: 'string',
          example: 'attachment; filename="beneficiarios.xlsx"',
        },
      },
      'Cache-Control': { schema: { type: 'string', example: 'no-store' } },
    },
  })
  async exportar(
    @Query() filtros: ConsultaExportacionDto,
    @Req() { user }: { user: { id: string } },
  ) {
    const archivo = await this.servicio.ejecutar(filtros, user.id);
    return new StreamableFile(archivo, {
      type: XLSX,
      disposition: 'attachment; filename="beneficiarios.xlsx"',
    });
  }
}
