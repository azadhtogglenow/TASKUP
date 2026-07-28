import { Router } from 'express';
import { authRoutes } from '../controllers/auth-Controller';

const router = Router();

router.post('/register', authRoutes.register);
router.post('/login', authRoutes.login);
router.get('/me', authRoutes.me);
router.get('/users',authRoutes.listUsers);

export default router;