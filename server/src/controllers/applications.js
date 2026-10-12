import mongoose from 'mongoose';
import Application from '../models/Application.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function createApplication(req, res) {
  const name = text(req.body.name);
  const phone = text(req.body.phone);
  if (!name || !phone) throw httpError(400, '이름과 연락처를 입력해 주세요.');

  const application = await Application.create({
    course: text(req.body.course),
    name,
    phone,
    people: text(req.body.people),
    hope_date: text(req.body.hope_date),
    message: text(req.body.message),
  });
  res.status(201).json(application);
}

export async function listApplications(req, res) {
  const applications = await Application.find().sort({ createdAt: -1 });
  res.json(applications);
}

export async function getApplication(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, '신청을 찾을 수 없습니다.');
  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, '신청을 찾을 수 없습니다.');
  res.json(application);
}
