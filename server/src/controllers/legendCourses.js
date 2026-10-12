import { COURSES } from '../../../client/src/data/courses.js';
import LegendCourse from '../models/LegendCourse.js';

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
        }))
        .filter((stop) => stop.where || stop.name || stop.desc)
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

export async function seedLegendCourses() {
  const count = await LegendCourse.countDocuments();
  if (count > 0) return;

  await LegendCourse.insertMany(
    COURSES.map((course) => ({
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
    })),
  );
}

export async function listLegendCourses(req, res) {
  const courses = await LegendCourse.find().sort({ createdAt: 1 });
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
