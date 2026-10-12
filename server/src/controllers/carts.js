import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Course from '../models/Course.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function quantityOf(value, fallback = 1) {
  const quantity = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw httpError(400, '수량은 1 이상이어야 합니다.');
  }
  return quantity;
}

function courseIdOf(value) {
  if (!mongoose.isValidObjectId(value)) throw httpError(400, '코스를 선택해 주세요.');
  return value;
}

async function present(cart) {
  return cart.populate('items.course');
}

export async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.course');
  res.json(cart ?? { user: req.user._id, items: [] });
}

export async function addCartItem(req, res) {
  const courseId = courseIdOf(req.body.course);
  const quantity = quantityOf(req.body.quantity);
  const course = await Course.findById(courseId);
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');

  const cart = (await Cart.findOne({ user: req.user._id })) ?? new Cart({ user: req.user._id, items: [] });
  const item = cart.items.find((entry) => String(entry.course) === String(courseId));
  if (item) item.quantity += quantity;
  else cart.items.push({ course: courseId, quantity });
  await cart.save();
  res.status(201).json(await present(cart));
}

export async function updateCartItem(req, res) {
  const courseId = courseIdOf(req.params.courseId);
  const quantity = quantityOf(req.body.quantity, undefined);
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.find((entry) => String(entry.course) === String(courseId));
  if (!item) throw httpError(404, '장바구니에 없는 코스입니다.');

  item.quantity = quantity;
  await cart.save();
  res.json(await present(cart));
}

export async function removeCartItem(req, res) {
  const courseId = courseIdOf(req.params.courseId);
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw httpError(404, '장바구니가 없습니다.');

  const before = cart.items.length;
  cart.items = cart.items.filter((entry) => String(entry.course) !== String(courseId));
  if (cart.items.length === before) throw httpError(404, '장바구니에 없는 코스입니다.');

  await cart.save();
  res.json(await present(cart));
}

export async function deleteCart(req, res) {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: '장바구니를 비웠습니다.' });
}
