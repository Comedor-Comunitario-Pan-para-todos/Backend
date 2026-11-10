import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BeneficiariosService } from './beneficiarios.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';

@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Post()
  create(@Body() createBeneficiarioDto: CreateBeneficiarioDto) {
    return this.beneficiariosService.create(createBeneficiarioDto);
  }

  @Get()
  findAll() {
    return this.beneficiariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.beneficiariosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBeneficiarioDto: UpdateBeneficiarioDto) {
    return this.beneficiariosService.update(+id, updateBeneficiarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.beneficiariosService.remove(+id);
  }
}
