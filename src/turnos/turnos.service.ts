import { Injectable } from '@nestjs/common';
import { EmitirTurnoUseCase } from './application/use-cases/emitir-turno.use-case.js';
import { ConsultarTurnosUseCase } from './application/use-cases/consultar-turnos.use-case.js';
import { CambiarEstadoTurnoUseCase } from './application/use-cases/cambiar-estado-turno.use-case.js';
import { CreateTurnoDto } from './dto/create-turno.dto.js';
import { QueryTurnosDto } from './dto/query-turnos.dto.js';
import { CancelarTurnoDto } from './dto/cancelar-turno.dto.js';

@Injectable()
export class TurnosService {
  constructor(
    private readonly emitirTurnoUseCase: EmitirTurnoUseCase,
    private readonly consultarTurnosUseCase: ConsultarTurnosUseCase,
    private readonly cambiarEstadoTurnoUseCase: CambiarEstadoTurnoUseCase,
  ) {}

  // 1. Emisión de nuevo turno diario consecutivo (RF-03, HU-26, HU-27)
  async emitirTurno(dto: CreateTurnoDto, emitidoPorUsuarioId: string) {
    return this.emitirTurnoUseCase.execute(dto.beneficiarioId, emitidoPorUsuarioId);
  }

  // 2. Consulta y filtrado de turnos de la fila
  async findAll(query: QueryTurnosDto) {
    const fecha = query.fecha ?? new Date().toISOString().slice(0, 10);
    return this.consultarTurnosUseCase.listar({
      fecha,
      estado: query.estado,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  // 3. Consultar turno por su ID
  async findOne(id: string) {
    return this.consultarTurnosUseCase.consultarPorId(id);
  }

  // 4. Consultar si un beneficiario ya tiene turno expedido hoy (para reja o reimpresión)
  async findHoyPorBeneficiario(beneficiarioId: string) {
    return this.consultarTurnosUseCase.consultarPorBeneficiarioHoy(beneficiarioId);
  }

  // 5. Marcar turno como atendido (comensal pasa a mesa)
  async marcarAtendido(id: string) {
    return this.cambiarEstadoTurnoUseCase.marcarAtendido(id);
  }

  // 6. Cancelar turno por retiro de fila o novedad
  async cancelar(id: string, dto?: CancelarTurnoDto) {
    return this.cambiarEstadoTurnoUseCase.cancelar(id, dto?.motivo);
  }
}
