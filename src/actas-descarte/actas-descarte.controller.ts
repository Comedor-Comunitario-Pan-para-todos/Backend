import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { AutorizarActaDescarteUseCase } from './application/use-cases/autorizar-acta-descarte.use-case.js';
import { ConsultarActasDescarteUseCase } from './application/use-cases/consultar-actas-descarte.use-case.js';
import { GenerarActaDescarteUseCase } from './application/use-cases/generar-acta-descarte.use-case.js';
import {
  ActaDescarteDto,
  RespuestaPaginadaActasDto,
} from './dto/acta-descarte.dto.js';
import {
  AutorizarActaDto,
  CrearActaDescarteDto,
} from './dto/crear-acta-descarte.dto.js';
import { QueryActasDescarteDto } from './dto/query-actas-descarte.dto.js';

@ApiTags('Actas de Descarte Trazables')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado o token JWT inválido' })
@ApiForbiddenResponse({ description: 'Acceso denegado: permisos insuficientes' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('actas-descarte')
export class ActasDescarteController {
  constructor(
    private readonly generarUseCase: GenerarActaDescarteUseCase,
    private readonly autorizarUseCase: AutorizarActaDescarteUseCase,
    private readonly consultarUseCase: ConsultarActasDescarteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA)
  @ApiOperation({
    summary: 'Generar nueva acta de descarte vinculada a donación de origen (RF-06)',
    description:
      'Crea un acta en estado PENDIENTE vinculada a una donación o lote. Si el donante es CORPORATIVO, la evidencia fotográfica JPG/PNG es obligatoria.',
  })
  @ApiCreatedResponse({
    description: 'Acta generada exitosamente en estado PENDIENTE',
    type: ActaDescarteDto,
  })
  crear(@Body() dto: CrearActaDescarteDto, @Req() req: any) {
    return this.generarUseCase.execute(dto, req.user.id);
  }

  @Get()
  @Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({ summary: 'Listar actas de descarte con paginación y filtros' })
  @ApiOkResponse({
    description: 'Listado de actas obtenido exitosamente',
    type: RespuestaPaginadaActasDto,
  })
  listar(@Query() query: QueryActasDescarteDto) {
    return this.consultarUseCase.executeListar(query);
  }

  @Get(':id')
  @Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({ summary: 'Consultar detalle de un acta de descarte por su ID' })
  @ApiOkResponse({
    description: 'Detalle del acta encontrado',
    type: ActaDescarteDto,
  })
  @ApiNotFoundResponse({ description: 'Acta de descarte no encontrada' })
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.consultarUseCase.executeObtenerPorId(id);
  }

  @Patch(':id/autorizar')
  @Roles(RolEnum.COORDINADORA)
  @ApiOperation({
    summary: 'Autorizar y firmar acta de descarte (Exclusivo Coordinadora)',
    description:
      'Pasa el estado del acta de PENDIENTE a AUTORIZADA y registra la auditoría y fecha de aprobación.',
  })
  @ApiOkResponse({
    description: 'Acta autorizada exitosamente',
    type: ActaDescarteDto,
  })
  @ApiNotFoundResponse({ description: 'Acta no encontrada' })
  autorizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AutorizarActaDto,
    @Req() req: any,
  ) {
    return this.autorizarUseCase.execute(id, dto, req.user);
  }

  @Get(':id/pdf')
  @Roles(RolEnum.COORDINADORA, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({ summary: 'Descargar reporte oficial del acta de descarte en PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'Documento PDF del acta de descarte' })
  async descargarPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.consultarUseCase.executeExportarPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="acta-descarte-${id}.pdf"`,
    );
    res.end(pdfBuffer);
  }
}
