import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Order, { ORDER_PAYMENTS, ORDER_STATUS } from '../models/Order.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isAdmin(user) {
  return user.user_type === 'admin';
}

function courseIdOf(value) {
  if (!mongoose.isValidObjectId(value)) throw httpError(400, '코스를 선택해 주세요.');
  return value;
}

function quantityOf(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) throw httpError(400, '수량은 1 이상이어야 합니다.');
  return quantity;
}

function peopleOf(value) {
  const people = Number(value);
  if (!Number.isInteger(people) || people < 1) throw httpError(400, '인원은 1명 이상이어야 합니다.');
  return people;
}

function dateOf(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw httpError(400, '여행 출발일을 입력해 주세요.');
  return date;
}

function timeOf(value) {
  const time = text(value);
  if (!/^\d{2}:\d{2}$/.test(time)) throw httpError(400, '출발시간을 입력해 주세요.');
  return time;
}

function placeOf(value) {
  const place = text(value);
  if (!place) throw httpError(400, '출발장소를 입력해 주세요.');
  return place;
}

function statusOf(value) {
  if (!ORDER_STATUS.includes(value)) throw httpError(400, '주문 상태는 결제완료 또는 취소여야 합니다.');
  return value;
}

function paymentOf(value) {
  if (!ORDER_PAYMENTS.includes(value)) throw httpError(400, '결제수단을 선택해 주세요.');
  return value;
}

function buyerOf(body, user) {
  const source = body?.buyer && typeof body.buyer === 'object' ? body.buyer : {};
  const name = text(source.name) || text(user.name);
  const phone = text(source.phone) || text(user.phone);
  const email = text(source.email) || text(user.email);
  if (!name || !phone || !email) throw httpError(400, '이름, 연락처, 이메일을 입력해 주세요.');
  return { name, phone, email };
}

function requestedItems(value) {
  if (!Array.isArray(value) || value.length === 0) throw httpError(400, '주문 코스를 1개 이상 담아 주세요.');
  const merged = new Map();
  for (const entry of value) {
    const courseId = String(courseIdOf(entry?.course));
    merged.set(courseId, (merged.get(courseId) ?? 0) + quantityOf(entry?.quantity));
  }
  return [...merged.entries()].map(([course, quantity]) => ({ course, quantity }));
}

async function orderItems(value) {
  const requested = requestedItems(value);
  const courses = await Course.find({ _id: { $in: requested.map((item) => item.course) } });
  if (courses.length !== requested.length) throw httpError(404, '코스를 찾을 수 없습니다.');

  return requested.map(({ course, quantity }) => {
    const found = courses.find((item) => String(item._id) === course);
    return {
      course: found._id,
      name: found.name,
      price: found.price,
      image: found.image,
      category: found.category,
      quantity,
    };
  });
}

function totalOf(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

async function findOrder(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, '주문을 찾을 수 없습니다.');
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, '주문을 찾을 수 없습니다.');
  if (!isAdmin(req.user) && String(order.user) !== String(req.user._id)) {
    throw httpError(403, '본인 주문만 다룰 수 있습니다.');
  }
  return order;
}

export async function listOrders(req, res) {
  const filter = isAdmin(req.user) ? {} : { user: req.user._id };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
}

export async function getOrder(req, res) {
  res.json(await findOrder(req));
}

export async function createOrder(req, res) {
  const items = await orderItems(req.body.items);
  const order = await Order.create({
    user: req.user._id,
    buyer: buyerOf(req.body, req.user),
    items,
    departure_date: dateOf(req.body.departure_date),
    departure_time: timeOf(req.body.departure_time),
    departure_place: placeOf(req.body.departure_place),
    people: peopleOf(req.body.people),
    payment_method: paymentOf(req.body.payment_method),
    total_price: totalOf(items),
    status: '결제완료',
  });
  res.status(201).json(order);
}

export async function updateOrder(req, res) {
  const order = await findOrder(req);

  if (req.body.status !== undefined) order.status = statusOf(req.body.status);
  if (req.body.departure_date !== undefined) order.departure_date = dateOf(req.body.departure_date);
  if (req.body.departure_time !== undefined) order.departure_time = timeOf(req.body.departure_time);
  if (req.body.departure_place !== undefined) order.departure_place = placeOf(req.body.departure_place);
  if (req.body.people !== undefined) order.people = peopleOf(req.body.people);
  if (req.body.buyer && typeof req.body.buyer === 'object') {
    const name = text(req.body.buyer.name);
    const phone = text(req.body.buyer.phone);
    const email = text(req.body.buyer.email);
    if (req.body.buyer.name !== undefined && !name) throw httpError(400, '이름은 필수입니다.');
    if (req.body.buyer.phone !== undefined && !phone) throw httpError(400, '연락처는 필수입니다.');
    if (req.body.buyer.email !== undefined && !email) throw httpError(400, '이메일은 필수입니다.');
    if (name) order.buyer.name = name;
    if (phone) order.buyer.phone = phone;
    if (email) order.buyer.email = email;
  }

  await order.save();
  res.json(order);
}

export async function deleteOrder(req, res) {
  const order = await findOrder(req);
  await order.deleteOne();
  res.json({ message: '주문을 삭제했습니다.' });
}
