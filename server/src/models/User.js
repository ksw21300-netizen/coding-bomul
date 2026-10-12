import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import mongoose from 'mongoose';

const scryptAsync = promisify(scrypt);

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: [true, '아이디는 필수입니다.'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [
        function requiredForLocalAccount() {
          return this.provider !== 'naver';
        },
        '비밀번호는 필수입니다.',
      ],
      select: false,
    },
    // 가입 시에만 비밀번호와 같은지 확인하고, 컬렉션에는 저장하지 않는다.
    password_confirm: {
      type: String,
      required: [
        function requiredOnPasswordChange() {
          return this.isModified('password') || (this.isNew && this.provider !== 'naver');
        },
        '비밀번호 확인은 필수입니다.',
      ],
      validate: {
        validator(value) {
          return value === this.password;
        },
        message: '비밀번호 확인이 비밀번호와 일치하지 않습니다.',
      },
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
    },
    nickname: {
      type: String,
      required: [true, '닉네임은 필수입니다.'],
      trim: true,
    },
    user_type: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: '회원 유형은 customer 또는 admin이어야 합니다.',
      },
      default: 'customer',
      required: [true, '회원 유형은 필수입니다.'],
    },
    phone: {
      type: String,
      required: [true, '전화번호는 필수입니다.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    provider: {
      type: String,
      enum: ['local', 'naver'],
      default: 'local',
    },
    naver_id: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(this.password, salt, 64);
    this.password = `${salt}:${derived.toString('hex')}`;
  }
  this.password_confirm = undefined;
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  const [salt, stored] = this.password.split(':');
  const derived = await scryptAsync(candidate, salt, 64);
  const storedBuf = Buffer.from(stored, 'hex');
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(storedBuf, derived);
};

export default mongoose.model('User', userSchema);
