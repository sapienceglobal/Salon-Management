import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createProductSchema, updateProductSchema, updateStockSchema, productIdParamSchema } from './products.validation.js';
import { getProducts, getProduct, createProduct, updateProduct, updateStock, deleteProduct, getLowStock } from './products.controller.js';

const router = Router();
router.use(authenticate, businessScope());

router.get('/', getProducts);
router.get('/low-stock', getLowStock);
router.get('/:id', validate(productIdParamSchema), getProduct);
router.post('/', authorize('super_admin', 'admin', 'manager'), validate(createProductSchema), createProduct);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), validate(updateProductSchema), updateProduct);
router.patch('/:id/stock', authorize('super_admin', 'admin', 'manager'), validate(updateStockSchema), updateStock);
router.delete('/:id', authorize('super_admin', 'admin'), validate(productIdParamSchema), deleteProduct);

export default router;
