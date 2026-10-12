import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  createLegendCourse,
  getLegendCourse,
  listLegendCourses,
  updateLegendCourse,
} from '../controllers/legendCourses.js';

const router = Router();

router.get('/', listLegendCourses);
router.get('/:slug', getLegendCourse);
router.post('/', requireAdmin, createLegendCourse);
router.patch('/:slug', requireAdmin, updateLegendCourse);

export default router;
