import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { createCourse, deleteCourse, getCourse, listCourses } from '../controllers/courses.js';

const router = Router();

router.get('/', listCourses);
router.get('/:id', getCourse);
router.post('/', requireAdmin, createCourse);
router.delete('/:id', requireAdmin, deleteCourse);

export default router;
