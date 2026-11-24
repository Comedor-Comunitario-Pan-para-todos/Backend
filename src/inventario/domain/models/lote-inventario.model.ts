export enum UnidadMedidaInsumoEnum {
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  UNIDAD = 'UNIDAD',
}

export enum EstadoLoteEnum {
  DISPONIBLE = 'DISPONIBLE',
  AGOTADO = 'AGOTADO',
  VENCIDO = 'VENCIDO',
  DESCARTADO = 'DESCARTADO',
}

export class LoteInventarioModel {
  constructor(
    public readonly id: string,
    public readonly codigoLote: string,
    public readonly nombreInsumo: string,
    public readonly categoria: string,
    public readonly cantidadInicial: number,
    public cantidadActual: number,
    public readonly unidadMedida: UnidadMedidaInsumoEnum,
    public readonly fechaRecepcion: Date,
    public readonly fechaVencimiento: Date,
    public estado: EstadoLoteEnum,
    public readonly donacionOrigenId?: string | null,
    public readonly nombreDonante?: string | null,
    public readonly observaciones?: string | null,
    public readonly registradoPorId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public estaVencido(fechaReferencia: Date = new Date()): boolean {
    return this.fechaVencimiento.getTime() < fechaReferencia.getTime();
  }

  public actualizarEstadoSegunStockYFecha(fechaReferencia: Date = new Date()): void {
    if (this.cantidadActual <= 0) {
      this.estado = EstadoLoteEnum.AGOTADO;
    } else if (this.estaVencido(fechaReferencia)) {
      this.estado = EstadoLoteEnum.VENCIDO;
    } else {
      this.estado = EstadoLoteEnum.DISPONIBLE;
    }
  }

  public descontarStock(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error('La cantidad a descontar debe ser mayor a cero');
    }
    if (cantidad > this.cantidadActual) {
      throw new Error(`Stock insuficiente. Disponible: ${this.cantidadActual}, solicitado: ${cantidad}`);
    }
    this.cantidadActual -= cantidad;
    this.actualizarEstadoSegunStockYFecha();
  }
}
