import User from '../models/User.js';
import { readUser, signToken } from '../middleware/auth.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function present(user) {
  const data = user.toObject();
  delete data.password;
  delete data.password_confirm;
  return data;
}

export async function login(req, res) {
  const user_id = typeof req.body.user_id === 'string' ? req.body.user_id.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!user_id || !password) throw httpError(400, '아이디와 비밀번호를 입력해 주세요.');

  const user = await User.findOne({ user_id }).select('+password');
  const matched = user ? await user.comparePassword(password) : false;
  if (!matched) throw httpError(401, '아이디 또는 비밀번호가 올바르지 않습니다.');

  res.json({ message: '로그인했습니다.', token: signToken(user), user: present(user) });
}

export function loginMethodNotAllowed(req, res) {
  res.set('Allow', 'POST');
  res.status(405).json({
    message: '로그인은 로그인 화면(http://localhost:5173/login)에서 해 주세요. 이 주소는 POST 요청만 받습니다.',
  });
}

export async function getMe(req, res) {
  const user = await readUser(req);
  res.json(present(user));
}
