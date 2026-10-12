import mongoose from 'mongoose';
import User from '../models/User.js';

const WRITABLE = ['user_id', 'password', 'password_confirm', 'name', 'nickname', 'user_type', 'phone', 'email'];

function pickWritable(body) {
  const data = {};
  for (const key of WRITABLE) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

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

async function findUser(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, '잘못된 사용자 id입니다.');
  const user = await User.findById(id);
  if (!user) throw httpError(404, '사용자를 찾을 수 없습니다.');
  return user;
}

export async function createUser(req, res) {
  const user = await User.create(pickWritable(req.body));
  res.status(201).json(present(user));
}

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(present));
}

export async function getUser(req, res) {
  const user = await findUser(req.params.id);
  res.json(present(user));
}

export async function updateUser(req, res) {
  const data = pickWritable(req.body);
  if (data.password === undefined) delete data.password_confirm;
  if (Object.keys(data).length === 0) throw httpError(400, '수정할 값이 없습니다.');

  const user = await findUser(req.params.id);
  Object.assign(user, data);
  await user.save();
  res.json(present(user));
}

export async function deleteUser(req, res) {
  const user = await findUser(req.params.id);
  await user.deleteOne();
  res.json({ message: '사용자를 삭제했습니다.' });
}
