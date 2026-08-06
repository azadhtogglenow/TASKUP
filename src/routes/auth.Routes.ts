import { Router } from 'express';
import { register, login, getProfile,deleteUserCache, logout } from '../controllers/auth-Controller.js';
import { authMiddleware } from '../middleware/auth-Middleware.js';

const router = Router();
router.post('/register', register);  
router.post('/login', login);       
router.delete('/cache', authMiddleware, deleteUserCache);  // DELETE /api/auth/cache
router.get('/profile', authMiddleware, getProfile);  // GET /api/auth/profile
router.post('/logout', authMiddleware,logout); // POST /api/auth/logout

export default router;