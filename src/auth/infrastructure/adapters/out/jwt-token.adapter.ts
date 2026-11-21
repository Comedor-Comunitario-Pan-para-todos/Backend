import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  TokenPayload,
  TokenServicePort,
} from '../../../domain/ports/token-service.port.js';

@Injectable()
export class JwtTokenAdapter implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwtService.sign(payload);
  }
}
