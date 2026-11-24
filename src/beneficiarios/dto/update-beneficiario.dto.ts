import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBeneficiarioDto } from './create-beneficiario.dto.js';

export class UpdateBeneficiarioDto extends PartialType(
  OmitType(CreateBeneficiarioDto, [
    'consentimiento',
    'nivel',
    'clasificacion',
    'autorizaTratamientoDatos',
  ] as const),
) {}
