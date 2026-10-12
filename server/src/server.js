import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import app from './app.js';
import { seedLegendCourses } from './controllers/legendCourses.js';

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { PORT = 4000, MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI가 없습니다. server/.env 파일을 확인하세요 (.env.example 참고).');
  process.exit(1);
}

try {
  // 기본값(30초) 대신 5초 만에 실패해서 MongoDB가 꺼져 있는지 바로 알 수 있게 함
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
} catch (error) {
  console.error('MongoDB 연결 실패:', error.message);
  process.exit(1);
}
await seedLegendCourses();
console.log(`MongoDB 연결됨: ${mongoose.connection.name}`);

const server = app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

function shutdown(signal) {
  server.close(() => {
    mongoose.disconnect().finally(() => {
      if (signal === 'SIGUSR2') {
        process.kill(process.pid, 'SIGUSR2');
        return;
      }
      process.exit(0);
    });
  });
}

process.once('SIGUSR2', () => shutdown('SIGUSR2'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
