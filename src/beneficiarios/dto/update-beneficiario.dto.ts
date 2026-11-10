import { PartialType } from '@nestjs/swagger';
import { CreateBeneficiarioDto } from './create-beneficiario.dto.js';

export class UpdateBeneficiarioDto extends PartialType(CreateBeneficiarioDto) { }
