import mongoose from 'mongoose';
import Course from '../models/Course.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function listCourses(req, res) {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json(courses);
}

export async function getCourse(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw httpError(404, '코스를 찾을 수 없습니다.');
  }

  const course = await Course.findById(req.params.id);
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');
  res.json(course);
}

export async function createCourse(req, res) {
  const name = text(req.body.name);
  const category = text(req.body.category);
  const image = text(req.body.image);
  const description = text(req.body.description);
  const price = Number(req.body.price);

  if (!name || !category || !image || !description || !Number.isFinite(price)) {
    throw httpError(400, '코스 이름, 가격, 카테고리, 이미지, 설명을 입력해 주세요.');
  }

  const course = await Course.create({ name, price, category, image, description });
  res.status(201).json(course);
}

export async function deleteCourse(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw httpError(404, '코스를 찾을 수 없습니다.');
  }

  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');
  res.json({ message: '코스를 삭제했습니다.' });
}
