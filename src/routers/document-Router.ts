import { Router } from 'express';
import { documentRoutes } from '../controllers/document-Controller';

const router = Router();

router.get('/', documentRoutes.getAll);
router.get('/mine', documentRoutes.getMine);
router.get('/:id', documentRoutes.getById);
router.post('/', documentRoutes.create);
router.put('/:id', documentRoutes.update);
router.delete('/:id',documentRoutes.delete);

export default router;