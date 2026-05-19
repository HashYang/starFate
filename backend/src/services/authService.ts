import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

async function fetchJWKS(url: string): Promise<{ keys: any[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  return res.json() as Promise<{ keys: any[] }>;
}

function findJWK(jwks: { keys: any[] }, kid: string): any {
  return jwks.keys.find((k) => k.kid === kid);
}

function createPublicKey(jwk: any): crypto.KeyObject {
  // JWK requires at minimum kty, n, e for RSA public keys
  const { kty, n, e, alg, use, kid, ...rest } = jwk;
  return crypto.createPublicKey({ format: 'jwk', key: { kty, n, e, ...rest } });
}

function decodeTokenHeader(idToken: string): { kid: string } {
  const decoded = jwt.decode(idToken, { complete: true }) as { header: { kid: string }; payload: any } | null;
  if (!decoded?.header?.kid) throw new Error('无效的认证令牌');
  return decoded.header;
}

export async function verifyGoogleToken(idToken: string): Promise<{ email: string; sub: string; name?: string }> {
  const [jwks, header] = await Promise.all([
    fetchJWKS('https://www.googleapis.com/oauth2/v3/certs'),
    Promise.resolve(decodeTokenHeader(idToken)),
  ]);

  const jwk = findJWK(jwks, header.kid);
  if (!jwk) throw new Error('No matching JWK key found');

  const publicKey = createPublicKey(jwk);
  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: config.google.clientId || undefined,
  }) as jwt.JwtPayload;

  if (!payload.email) throw new Error('Google token missing email');

  return {
    email: payload.email,
    sub: payload.sub!,
    name: payload.name,
  };
}

export async function verifyAppleToken(idToken: string): Promise<{ email: string; sub: string }> {
  const [jwks, header] = await Promise.all([
    fetchJWKS('https://appleid.apple.com/auth/keys'),
    Promise.resolve(decodeTokenHeader(idToken)),
  ]);

  const jwk = findJWK(jwks, header.kid);
  if (!jwk) throw new Error('No matching JWK key found');

  const publicKey = createPublicKey(jwk);
  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: config.apple.clientId || undefined,
  }) as jwt.JwtPayload;

  return {
    email: payload.email || `${payload.sub}@privaterelay.appleid.com`,
    sub: payload.sub!,
  };
}
