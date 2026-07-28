import { Router } from 'express';
import { chunkRoutes } from '../controllers/chunk-Controller';

const router = Router();

router.get('/document/:documentId', chunkRoutes.getByDocument);
router.post('/document/:documentId', chunkRoutes.create);
router.delete('/:id', chunkRoutes.delete);

export default router;