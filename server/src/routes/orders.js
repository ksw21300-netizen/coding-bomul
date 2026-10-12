import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { createOrder, deleteOrder, getOrder, listOrders, updateOrder } from '../controllers/orders.js';

const router = Router();

router.use(requireUser);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
