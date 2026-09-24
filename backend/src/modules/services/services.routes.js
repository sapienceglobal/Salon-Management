import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createCategorySchema, updateCategorySchema, createServiceSchema, updateServiceSchema, serviceIdParamSchema, categoryIdParamSchema } from './services.validation.js';
import { getCategories, createCategory, updateCategory, deleteCategory, getServices, getService, getServicesByCategory, createService, updateService, deleteService } from './services.controller.js';
import { multipleImages } from '../../utils/fileUpload.js';

const router = Router();
router.use(authenticate, businessScope());

// Categories
router.get('/categories', getCategories);
router.post('/categories', authorize('super_admin', 'admin', 'manager'), validate(createCategorySchema), createCategory);
router.put('/categories/:id', authorize('super_admin', 'admin', 'manager'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', authorize('super_admin', 'admin'), validate(categoryIdParamSchema), deleteCategory);

// Services
router.get('/', getServices);
router.get('/:id', validate(serviceIdParamSchema), getService);
router.get('/category/:id', validate(categoryIdParamSchema), getServicesByCategory);
router.post('/', authorize('super_admin', 'admin', 'manager'), multipleImages('images', 5), validate(createServiceSchema), createService);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), multipleImages('images', 5), validate(updateServiceSchema), updateService);
router.delete('/:id', authorize('super_admin', 'admin'), validate(serviceIdParamSchema), deleteService);

export default router;
