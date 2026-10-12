import { Router } from 'express';
import { getMe } from '../controllers/auth.js';

const router = Router();

router.get('/', getMe);

export default router;
