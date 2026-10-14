import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    where: { type: String, default: '', trim: true },
    name: { type: String, default: '', trim: true },
    desc: { type: String, default: '', trim: true },
    addr: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const legendCourseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    region: { type: String, required: [true, '지역은 필수입니다.'], trim: true },
    theme: { type: String, required: [true, '테마는 필수입니다.'], trim: true },
    title: { type: String, required: [true, '코스 제목은 필수입니다.'], trim: true },
    summary: { type: String, required: [true, '코스 설명은 필수입니다.'], trim: true },
    thumb: { type: String, default: '' },
    hero: { type: String, default: '' },
    map: { type: String, default: '' },
    info: {
      거리: { type: String, default: '' },
      소요시간: { type: String, default: '' },
      난이도: { type: String, default: '' },
      집결지: { type: String, default: '' },
    },
    stops: { type: [stopSchema], default: [] },
    stories: { type: [String], default: [] },
    syncVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('LegendCourse', legendCourseSchema);
