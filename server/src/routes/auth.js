import { Router } from 'express';
import { login, loginMethodNotAllowed } from '../controllers/auth.js';
import { naverCallback, naverStart } from '../controllers/naver.js';

const router = Router();

router.post('/', login);
router.all('/', loginMethodNotAllowed);
router.get('/naver', naverStart);
router.get('/naver/callback', naverCallback);

export default router;
