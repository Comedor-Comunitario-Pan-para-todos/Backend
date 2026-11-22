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
    if (!fechaNacimiento) return false;
    const fecha = new Date(fechaNacimiento);
    if (isNaN(fecha.getTime())) return false;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mesDiff = hoy.getMonth() - fecha.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad < 18;
  }
}
