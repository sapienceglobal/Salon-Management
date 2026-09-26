import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createCustomerSchema, updateCustomerSchema,
  customerIdParamSchema, listCustomersQuerySchema, bulkImportCustomersSchema
} from './customers.validation.js';
import {
  getCustomers, getCustomer, getCustomerProfile, createCustomer,
  updateCustomer, deleteCustomer, getVisitHistory, getWalletHistory, getRewardHistory, getCustomersStats,
  importCustomers
} from './customers.controller.js';
import { singleImage } from '../../utils/fileUpload.js';

const router = Router();

// All routes require authentication + business scope
router.use(authenticate, businessScope());

router.get('/', validate(listCustomersQuerySchema), getCustomers);
router.get('/stats/metrics', getCustomersStats);
router.get('/:id', validate(customerIdParamSchema), getCustomer);
router.get('/:id/profile', validate(customerIdParamSchema), getCustomerProfile);
router.get('/:id/visits', validate(customerIdParamSchema), getVisitHistory);
router.get('/:id/wallet', validate(customerIdParamSchema), getWalletHistory);
router.get('/:id/rewards', validate(customerIdParamSchema), getRewardHistory);
router.post('/bulk', validate(bulkImportCustomersSchema), importCustomers);
router.post('/', singleImage('image'), validate(createCustomerSchema), createCustomer);
router.put('/:id', singleImage('image'), validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', authorize('super_admin', 'admin', 'manager'), validate(customerIdParamSchema), deleteCustomer);

export default router;
