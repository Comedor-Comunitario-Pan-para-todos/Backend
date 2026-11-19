export class BeneficiarioModel {
  constructor(
    public readonly id: string,
    public readonly tipoDocumento: string,
    public readonly numeroDocumento: string,
    public readonly nombres: string,
    public readonly apellidos: string,
    public readonly fechaNacimiento: string,
    public readonly barrio?: string,
    public readonly telefono?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {}

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }
}

