import { createHmac, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function tokenSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw httpError(500, 'JWT_SECRET이 없습니다. server/.env 파일을 확인하세요.');
  return secret;
}

export function signToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    user_id: user.user_id,
    user_type: user.user_type,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString('base64url');
  const signature = createHmac('sha256', tokenSecret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw httpError(401, '토큰이 올바르지 않습니다.');
  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', tokenSecret()).update(`${header}.${payload}`).digest('base64url');
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    throw httpError(401, '토큰이 올바르지 않습니다.');
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    throw httpError(401, '토큰이 올바르지 않습니다.');
  }
  if (!claims.exp || claims.exp * 1000 <= Date.now()) throw httpError(401, '토큰이 만료되었습니다.');
  if (!mongoose.isValidObjectId(claims.sub)) throw httpError(401, '토큰이 올바르지 않습니다.');
  return claims;
}

export async function readUser(req) {
  const header = req.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw httpError(401, '토큰이 필요합니다.');

  const claims = verifyToken(match[1]);
  const user = await User.findById(claims.sub);
  if (!user) throw httpError(401, '토큰이 올바르지 않습니다.');
  return user;
}

export async function requireUser(req, res, next) {
  req.user = await readUser(req);
  next();
}

export async function requireAdmin(req, res, next) {
  req.user = await readUser(req);
  if (req.user.user_type !== 'admin') throw httpError(403, '관리자만 볼 수 있습니다.');
  next();
}
