export class DescarteModel {
  constructor(
    public readonly id: string,
    public readonly alimento: string,
    public readonly cantidad: number,
    public readonly unidadMedida: string,
    public readonly motivo: string,
    public readonly fecha: Date,
    public readonly evaluadoPor: string,
    public readonly autorizadoPorId: string,
    public readonly loteId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {
    if (cantidad <= 0) {
      throw new Error('La cantidad de alimento descartada debe ser mayor a cero.');
    }
  }
}
