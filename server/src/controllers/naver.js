import { randomBytes } from 'node:crypto';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const CLIENT_URL = 'http://localhost:5173';
// 네이버 개발자센터에 등록한 Callback URL과 글자 하나까지 같아야 한다.
const CALLBACK_URL = 'http://localhost:4000/api/login/naver/callback';
const STATE_COOKIE = 'naver_state';
const STATE_COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax', path: '/api/login/naver' };

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function redirectToClient(res, params) {
  res.redirect(`${CLIENT_URL}/login/naver#${new URLSearchParams(params)}`);
}

function readCookie(req, name) {
  for (const part of (req.get('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return '';
}

export function naverStart(req, res) {
  const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env;
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    redirectToClient(res, {
      error: '네이버 로그인 설정이 없습니다. server/.env의 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 확인하세요.',
    });
    return;
  }

  const state = randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { ...STATE_COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    state,
  });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}

async function fetchNaverProfile(code, state) {
  const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code,
      state,
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenData.access_token) {
    throw new Error(`네이버 토큰 발급 실패: ${tokenData.error_description || tokenData.error || tokenResponse.status}`);
  }

  const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { authorization: `Bearer ${tokenData.access_token}` },
  });
  const profileData = await profileResponse.json().catch(() => ({}));
  if (profileData.resultcode !== '00' || !profileData.response?.id) {
    throw new Error(`네이버 프로필 조회 실패: ${profileData.message || profileResponse.status}`);
  }
  return profileData.response;
}

export async function findOrCreateNaverUser(profile) {
  const existing = await User.findOne({ naver_id: profile.id });
  if (existing) return existing;

  const missing = [];
  if (!profile.name) missing.push('이름');
  if (!profile.email) missing.push('이메일');
  if (!profile.mobile) missing.push('휴대전화번호');
  if (missing.length > 0) {
    throw httpError(400, `네이버에서 ${missing.join(', ')} 정보를 받지 못했습니다. 정보 제공에 동의한 뒤 다시 시도해 주세요.`);
  }

  const email = profile.email.trim().toLowerCase();
  if (await User.exists({ email })) {
    throw httpError(409, '같은 이메일로 가입된 계정이 있습니다. 아이디와 비밀번호로 로그인해 주세요.');
  }

  return User.create({
    provider: 'naver',
    naver_id: profile.id,
    user_id: `naver_${profile.id}`,
    name: profile.name,
    nickname: profile.nickname || profile.name,
    phone: profile.mobile,
    email,
  });
}

export async function naverCallback(req, res) {
  const savedState = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, STATE_COOKIE_OPTIONS);

  if (req.query.error) {
    const message = req.query.error === 'access_denied' ? '네이버 로그인을 취소했습니다.' : '네이버 로그인에 실패했습니다.';
    redirectToClient(res, { error: message });
    return;
  }

  const { code, state } = req.query;
  if (typeof code !== 'string' || typeof state !== 'string' || !savedState || state !== savedState) {
    redirectToClient(res, { error: '네이버 로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.' });
    return;
  }

  try {
    const profile = await fetchNaverProfile(code, state);
    const user = await findOrCreateNaverUser(profile);
    redirectToClient(res, { token: signToken(user) });
  } catch (error) {
    const status = error.status ?? 500;
    if (status >= 500) console.error(error);
    redirectToClient(res, { error: status < 500 ? error.message : '네이버 로그인에 실패했습니다.' });
  }
}
