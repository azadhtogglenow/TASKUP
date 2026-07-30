import { Router } from 'express';
import * as userController from '../controllers/user-Controller';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();


router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/me', authenticate, userController.getProfile);
router.get('/users', authenticate, userController.getAllUsers);

export default router;