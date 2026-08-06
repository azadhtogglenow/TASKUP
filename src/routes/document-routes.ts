import { Router } from 'express';
import { 
  createDocument, 
  getDocuments, 
  getDocument, 
  searchDocuments, 
  deleteDocument 
} from '../controllers/document-Controller.js';
import { authMiddleware } from '../middleware/auth-Middleware.js';


const router = Router();


router.use(authMiddleware);

router.post('/', createDocument);          
router.get('/', getDocuments);           
router.get('/:id', getDocument);            
router.post('/search', searchDocuments);   
router.delete('/:id', deleteDocument);      

export default router;