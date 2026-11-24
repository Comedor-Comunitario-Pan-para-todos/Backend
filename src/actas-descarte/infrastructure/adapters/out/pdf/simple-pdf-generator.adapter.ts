import { Injectable } from '@nestjs/common';
import type { ActaDescarteModel } from '../../../../domain/models/acta-descarte.model.js';
import type { PdfGeneratorPort } from '../../../../domain/ports/acta-descarte-repository.port.js';

@Injectable()
export class SimplePdfGeneratorAdapter implements PdfGeneratorPort {
  async generarPdfActa(acta: ActaDescarteModel): Promise<Buffer> {
    // Generación de documento PDF estructurado en formato binario estándar
    // RNF-10: No asocia personas beneficiarias ni exhibe marcas protegidas
    const lineas = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    ];

    const textoActa = [
      `COMEDOR COMUNITARIO PAN PARA TODOS - SIG-CCPT`,
      `ACTA DE DESCARTE Y BAJA TRAZABLE DE ALIMENTOS`,
      `Numero de Acta: ${acta.numeroActa}`,
      `Insumo / Alimento: ${acta.insumo}`,
      `Cantidad: ${acta.cantidad} ${acta.unidadMedida}`,
      `Tipo de Donante: ${acta.tipoDonante}`,
      `Donacion de Origen: ${acta.donacionOrigenId}`,
      `Motivo de Baja: ${acta.motivo}`,
      `Estado: ${acta.estado}`,
      `Fecha de Registro: ${acta.createdAt ? new Date(acta.createdAt).toISOString() : new Date().toISOString()}`,
      `Autorizado Por ID: ${acta.autorizadaPorId ?? 'Pendiente de autorizacion'}`,
      `Fecha Autorizacion: ${acta.fechaAutorizacion ? new Date(acta.fechaAutorizacion).toISOString() : 'N/A'}`,
      `Observaciones: ${acta.observaciones ?? 'Sin observaciones'}`,
      `Evidencias Adjuntas: ${acta.evidencias.length} fotografia(s) verificada(s)`,
    ];

    let streamContenido = 'BT /F1 11 Tf 50 720 Td 18 TL ';
    for (const linea of textoActa) {
      // Escapar caracteres de PDF
      const escapada = linea.replace(/[()\\]/g, '\\$&');
      streamContenido += `(${escapada}) ' `;
    }
    streamContenido += 'ET';

    lineas.push(
      `4 0 obj << /Length ${streamContenido.length} >> stream\n${streamContenido}\nendstream\nendobj`,
    );

    lineas.push('xref');
    lineas.push('0 6');
    lineas.push('0000000000 65535 f ');
    lineas.push('0000000010 00000 n ');
    lineas.push('0000000060 00000 n ');
    lineas.push('0000000117 00000 n ');
    lineas.push('0000000250 00000 n ');
    lineas.push('0000000350 00000 n ');
    lineas.push('trailer << /Size 6 /Root 1 0 R >>');
    lineas.push('startxref');
    lineas.push('450');
    lineas.push('%%EOF');

    return Buffer.from(lineas.join('\n'), 'utf-8');
  }
}
