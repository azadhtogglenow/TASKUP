import { Router } from 'express';
import * as documentController from '../controllers/document-Controller';
import {
  validate,
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  listDocumentsSchema,
} from '../utils/validation';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', validate(createDocumentSchema), documentController.createDocument);
router.get('/', validate(listDocumentsSchema), documentController.getDocuments);
router.get('/:id', validate(documentIdSchema), documentController.getDocumentById);
router.put('/:id', validate(updateDocumentSchema), documentController.updateDocument);
router.delete('/:id', validate(documentIdSchema), documentController.deleteDocument);

export default router;