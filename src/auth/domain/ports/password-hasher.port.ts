export interface PasswordHasherPort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashed: string): Promise<boolean>;
}

export const PASSWORD_HASHER_PORT = Symbol('PasswordHasherPort');

