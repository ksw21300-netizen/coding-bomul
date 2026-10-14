import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { buyMembership, getMembership } from '../controllers/memberships.js';

const router = Router();

router.get('/', getMembership);
router.post('/', requireUser, buyMembership);

export default router;
