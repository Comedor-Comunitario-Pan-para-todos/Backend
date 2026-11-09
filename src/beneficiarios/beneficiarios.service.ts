import { Injectable } from '@nestjs/common';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';

@Injectable()
export class BeneficiariosService {
  create(createBeneficiarioDto: CreateBeneficiarioDto) {
    return 'This action adds a new beneficiario';
  }

  findAll() {
    return `This action returns all beneficiarios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} beneficiario`;
  }

  update(id: number, updateBeneficiarioDto: UpdateBeneficiarioDto) {
    return `This action updates a #${id} beneficiario`;
  }

  remove(id: number) {
    return `This action removes a #${id} beneficiario`;
  }
}
