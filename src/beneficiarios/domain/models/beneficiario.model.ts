import { clasificarEdad } from '../edad-beneficiario.js';
import { NivelRegistroEnum } from '../../enums/nivel-registro.enum.js';

export class BeneficiarioModel {
  constructor(
    public readonly id: string,
    public readonly nivelRegistro: NivelRegistroEnum = NivelRegistroEnum.BASICO,
    public readonly tipoDocumento: string | null = null,
    public readonly numeroDocumento: string | null = null,
    public readonly nombres: string = '',
    public readonly apellidos: string = '',
    public readonly fechaNacimiento: string = '',
    public readonly esMenorEdad: boolean = false,
    public readonly barrio?: string,
    public readonly telefono?: string,
    public readonly clasificacionSocioeconomica?: string,
    public readonly autorizaTratamientoDatos: boolean = false,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {}

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }

  static calcularEsMenorEdad(fechaNacimiento: string | Date): boolean {
    const fecha =
      fechaNacimiento instanceof Date
        ? Number.isFinite(fechaNacimiento.getTime())
          ? fechaNacimiento.toISOString().slice(0, 10)
          : ''
        : fechaNacimiento;
    return clasificarEdad(fecha) === 'menor';
  }
}
