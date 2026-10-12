import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    course: { type: String, trim: true, default: '' },
    name: { type: String, required: [true, '이름은 필수입니다.'], trim: true },
    phone: { type: String, required: [true, '연락처는 필수입니다.'], trim: true },
    people: { type: String, trim: true, default: '' },
    hope_date: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['접수', '확정', '완료'],
      default: '접수',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Application', applicationSchema);
