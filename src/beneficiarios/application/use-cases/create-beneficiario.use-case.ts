import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateBeneficiarioDto } from '../../dto/create-beneficiario.dto.js';
import { NivelRegistroEnum } from '../../enums/nivel-registro.enum.js';
import { BeneficiarioModel } from '../../domain/models/beneficiario.model.js';
import {
  BENEFICIARIO_REPOSITORY_PORT,
  type BeneficiarioRepositoryPort,
} from '../../domain/ports/beneficiario-repository.port.js';

@Injectable()
export class CreateBeneficiarioUseCase {
  constructor(
    @Inject(BENEFICIARIO_REPOSITORY_PORT)
    private readonly beneficiarioRepo: BeneficiarioRepositoryPort,
  ) {}

  async execute(dto: CreateBeneficiarioDto) {
    const nivelRegistro = dto.nivelRegistro || NivelRegistroEnum.BASICO;
    const esExtendido = nivelRegistro === NivelRegistroEnum.EXTENDIDO;

    // Validación condicional del nivel extendido (RF-02 / HU-13 Criterio 3)
    if (esExtendido) {
      if ((dto.tipoDocumento && !dto.numeroDocumento) || (!dto.tipoDocumento && dto.numeroDocumento)) {
        throw new BadRequestException(
          'En el registro extendido, si se especifica el tipo de documento también debe indicarse el número y viceversa',
        );
      }
    }

    // Minimización de datos para el nivel básico (RF-02 / HU-13 Criterio 4 - Ley 1581)
    const datosFinales: Partial<BeneficiarioModel> = {
      nivelRegistro,
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      fechaNacimiento: dto.fechaNacimiento,
      barrio: dto.barrio?.trim() || undefined,
      autorizaTratamientoDatos: dto.autorizaTratamientoDatos,
      esMenorEdad: BeneficiarioModel.calcularEsMenorEdad(dto.fechaNacimiento),
      tipoDocumento: esExtendido ? dto.tipoDocumento || undefined : undefined,
      numeroDocumento: esExtendido ? dto.numeroDocumento || undefined : undefined,
      telefono: esExtendido ? dto.telefono?.trim() || undefined : undefined,
      clasificacionSocioeconomica: esExtendido
        ? dto.clasificacionSocioeconomica?.trim() || undefined
        : undefined,
    };

    // Prevención de duplicados (RF-01, RNF-15)
    if (datosFinales.numeroDocumento) {
      const existe = await this.beneficiarioRepo.findByDocumento(datosFinales.numeroDocumento);
      if (existe) {
        throw new ConflictException(
          `Ya existe un beneficiario registrado con el documento ${datosFinales.numeroDocumento}`,
        );
      }
    } else {
      const existe = await this.beneficiarioRepo.findByDatosBasicos(
        datosFinales.nombres!,
        datosFinales.apellidos!,
        datosFinales.fechaNacimiento!,
        datosFinales.barrio,
      );
      if (existe) {
        throw new ConflictException(
          'Ya existe un beneficiario registrado con los mismos nombres, apellidos, fecha de nacimiento y barrio',
        );
      }
    }

    return this.beneficiarioRepo.save(datosFinales);
  }
}
