import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import LegendCourse from '../models/LegendCourse.js';

const SEED_VERSION = 2;
const LEGEND_SEED = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/legendCourses.json'), 'utf8'),
);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function emptyToNull(value) {
  const trimmed = text(value);
  return trimmed || null;
}

function toPublic(course) {
  return {
    id: course.slug,
    region: course.region,
    theme: course.theme,
    title: course.title,
    summary: course.summary,
    thumb: emptyToNull(course.thumb),
    hero: emptyToNull(course.hero),
    map: emptyToNull(course.map),
    info: {
      거리: emptyToNull(course.info?.거리),
      소요시간: emptyToNull(course.info?.소요시간),
      난이도: emptyToNull(course.info?.난이도),
      집결지: emptyToNull(course.info?.집결지),
    },
    stops: course.stops ?? [],
    stories: course.stories ?? [],
  };
}

function readBody(body) {
  const region = text(body.region);
  const theme = text(body.theme);
  const title = text(body.title);
  const summary = text(body.summary);
  if (!region || !theme || !title || !summary) {
    throw httpError(400, '지역, 테마, 제목, 설명을 입력해 주세요.');
  }

  const stops = Array.isArray(body.stops)
    ? body.stops
        .map((stop) => ({
          where: text(stop?.where),
          name: text(stop?.name),
          desc: text(stop?.desc),
          addr: text(stop?.addr),
        }))
        .filter((stop) => stop.where || stop.name || stop.desc || stop.addr)
    : [];
  const stories = Array.isArray(body.stories) ? body.stories.map((item) => text(item)).filter(Boolean) : [];

  return {
    region,
    theme,
    title,
    summary,
    thumb: text(body.thumb),
    hero: text(body.hero),
    map: text(body.map),
    info: {
      거리: text(body.info?.거리),
      소요시간: text(body.info?.소요시간),
      난이도: text(body.info?.난이도),
      집결지: text(body.info?.집결지),
    },
    stops,
    stories,
  };
}

function seedDoc(course) {
  return {
    slug: course.id,
    region: course.region,
    theme: course.theme,
    title: course.title,
    summary: course.summary,
    thumb: course.thumb || '',
    hero: course.hero || '',
    map: course.map || '',
    info: {
      거리: course.info?.거리 || '',
      소요시간: course.info?.소요시간 || '',
      난이도: course.info?.난이도 || '',
      집결지: course.info?.집결지 || '',
    },
    stops: course.stops ?? [],
    stories: course.stories ?? [],
    syncVersion: SEED_VERSION,
  };
}

async function removeDuplicateLegendCourses() {
  const docs = await LegendCourse.find().select('slug syncVersion').lean();
  const groups = new Map();
  for (const doc of docs) {
    const list = groups.get(doc.slug) || [];
    list.push(doc);
    groups.set(doc.slug, list);
  }
  const stale = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => (b.syncVersion || 0) - (a.syncVersion || 0));
    stale.push(...list.slice(1).map((doc) => doc._id));
  }
  if (stale.length) await LegendCourse.deleteMany({ _id: { $in: stale } });
  await LegendCourse.syncIndexes();
}

export async function seedLegendCourses() {
  await removeDuplicateLegendCourses();
  const alreadySeeded = await LegendCourse.exists({ syncVersion: { $gte: SEED_VERSION } });
  for (const course of LEGEND_SEED) {
    const current = await LegendCourse.findOne({ slug: course.id });
    if (!current) {
      if (!alreadySeeded) await LegendCourse.create(seedDoc(course));
      continue;
    }
    if ((current.syncVersion || 0) < SEED_VERSION) {
      await LegendCourse.updateOne({ slug: course.id }, seedDoc(course));
    }
  }
}

export async function listLegendCourses(req, res) {
  const courses = await LegendCourse.find();
  const order = new Map(LEGEND_SEED.map((course, index) => [course.id, index]));
  courses.sort((a, b) => {
    const left = order.has(a.slug) ? order.get(a.slug) : 1000;
    const right = order.has(b.slug) ? order.get(b.slug) : 1000;
    return left - right || a.title.localeCompare(b.title, 'ko');
  });
  res.json(courses.map(toPublic));
}

export async function getLegendCourse(req, res) {
  const course = await LegendCourse.findOne({ slug: req.params.slug });
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');
  res.json(toPublic(course));
}

export async function createLegendCourse(req, res) {
  const course = await LegendCourse.create({
    slug: `legend-${Date.now().toString(36)}`,
    ...readBody(req.body),
  });
  res.status(201).json(toPublic(course));
}

export async function updateLegendCourse(req, res) {
  const course = await LegendCourse.findOneAndUpdate({ slug: req.params.slug }, readBody(req.body), {
    new: true,
    runValidators: true,
  });
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');
  res.json(toPublic(course));
}

export async function deleteLegendCourse(req, res) {
  const course = await LegendCourse.findOneAndDelete({ slug: req.params.slug });
  if (!course) throw httpError(404, '코스를 찾을 수 없습니다.');
  res.json({ message: '코스를 삭제했습니다.' });
}
