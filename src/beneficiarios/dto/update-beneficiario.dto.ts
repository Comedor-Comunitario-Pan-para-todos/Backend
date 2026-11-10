import { PartialType } from '@nestjs/swagger';
import { CreateBeneficiarioDto } from './create-beneficiario.dto';

export class UpdateBeneficiarioDto extends PartialType(CreateBeneficiarioDto) {}
