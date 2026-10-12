import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { createApplication, getApplication, listApplications } from '../controllers/applications.js';

const router = Router();

router.post('/', createApplication);
router.get('/', requireAdmin, listApplications);
router.get('/:id', requireAdmin, getApplication);

export default router;
