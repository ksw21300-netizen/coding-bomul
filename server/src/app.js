import express from 'express';
import mongoose from 'mongoose';
import applicationsRouter from './routes/applications.js';
import cartsRouter from './routes/carts.js';
import coursesRouter from './routes/courses.js';
import legendCoursesRouter from './routes/legendCourses.js';
import membershipsRouter from './routes/memberships.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import usersRouter from './routes/users.js';

const app = express();

function isLocalClient(origin) {
  try {
    const url = new URL(origin);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const port = Number(url.port);
    return url.protocol === 'http:' && local && port >= 5173 && port <= 5179;
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && isLocalClient(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.ConnectionStates[mongoose.connection.readyState],
  });
});

app.use('/api/login', authRouter);
app.use('/api/me', meRouter);
app.use('/api/users', usersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/membership', membershipsRouter);
app.use('/api/legend-courses', legendCoursesRouter);

app.get('/api/cloudinary', (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    return res.status(500).json({
      message: 'Cloudinary 설정이 없습니다. server/.env의 CLOUDINARY_CLOUD_NAME과 CLOUDINARY_UPLOAD_PRESET을 확인하세요.',
    });
  }
  res.json({ cloudName, uploadPreset });
});

app.use((req, res) => {
  res.status(404).json({ message: `${req.method} ${req.originalUrl} 경로를 찾을 수 없습니다.` });
});

// 인자가 4개(err, req, res, next)여야 Express가 에러 핸들러로 인식하므로 next를 지우면 안 됨
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(' ');
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    const label = field === 'email' ? '이메일' : field === 'user_id' ? '아이디' : '값';
    return res.status(409).json({ message: `이미 사용 중인 ${label}입니다.` });
  }

  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status < 500 ? err.message : '서버 오류가 발생했습니다.' });
});

export default app;
