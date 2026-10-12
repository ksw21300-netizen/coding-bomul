import mongoose from 'mongoose';

const CATEGORIES = ['경주', '제주', '부여', '공주', '강원', '설악', '전라', '기타'];

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '코스 이름은 필수입니다.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, '코스 가격은 필수입니다.'],
      min: [0, '코스 가격은 0 이상이어야 합니다.'],
    },
    category: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      enum: {
        values: CATEGORIES,
        message: '카테고리는 경주, 제주, 부여, 공주, 강원, 설악, 전라, 기타 중 하나여야 합니다.',
      },
    },
    image: {
      type: String,
      required: [true, '이미지는 필수입니다.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, '설명은 필수입니다.'],
      trim: true,
    },
  },
  { timestamps: true },
);

export const COURSE_CATEGORIES = CATEGORIES;
export default mongoose.model('Course', courseSchema);
