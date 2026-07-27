import { Router } from 'express';
import { jobRoutes } from '../controllers/job-Controller';

const router = Router();

router.get('/', jobRoutes.getAll);
router.get('/mine', jobRoutes.getMine);
router.get('/document/:documentId', ...jobRoutes.getByDocument);
router.get('/:id',jobRoutes.getById);
router.post('/', jobRoutes.create);
router.put('/:id',jobRoutes.update);

export default router;