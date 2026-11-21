import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { PasswordHasherPort } from '../../../domain/ports/password-hasher.port.js';

@Injectable()
export class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  async hash(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainText, salt);
  }

  async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
