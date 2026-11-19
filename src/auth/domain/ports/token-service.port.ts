export interface TokenPayload {
  sub: string;
  email: string;
  rol: string;
}

export interface TokenServicePort {
  sign(payload: TokenPayload): string;
}

export const TOKEN_SERVICE_PORT = Symbol('TokenServicePort');
