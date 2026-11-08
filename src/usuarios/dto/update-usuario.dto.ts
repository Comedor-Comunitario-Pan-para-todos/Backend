import { PartialType, PickType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// La contraseña NO se edita aquí: tiene su propio endpoint (reset-password)
export class UpdateUsuarioDto extends PartialType(
    PickType(CreateUsuarioDto, ['email', 'nombreCompleto', 'rol'] as const),
) { }