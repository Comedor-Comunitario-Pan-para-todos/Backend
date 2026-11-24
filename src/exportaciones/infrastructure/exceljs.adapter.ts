import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type {
  FilaBeneficiario,
  GeneradorExcel,
} from '../domain/exportaciones.js';

@Injectable()
export class ExcelJsAdapter implements GeneradorExcel {
  async generar(filas: FilaBeneficiario[]) {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet('Beneficiarios');
    hoja.columns = [
      { header: 'Nombres', key: 'nombres', width: 32 },
      { header: 'Apellidos', key: 'apellidos', width: 32 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const { nombres, apellidos } of filas)
      hoja.addRow([nombres, apellidos]);
    return Buffer.from(await libro.xlsx.writeBuffer());
  }
}
