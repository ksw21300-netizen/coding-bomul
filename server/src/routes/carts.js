import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { addCartItem, deleteCart, getCart, removeCartItem, updateCartItem } from '../controllers/carts.js';

const router = Router();

router.use(requireUser);
router.get('/', getCart);
router.post('/', addCartItem);
router.delete('/', deleteCart);
router.patch('/:courseId', updateCartItem);
router.delete('/:courseId', removeCartItem);

export default router;
