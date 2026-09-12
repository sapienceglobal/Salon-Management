import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createInvoiceSchema, addPaymentSchema, refundPaymentSchema, invoiceIdParamSchema, listInvoicesSchema, updateInvoiceSchema } from './billing.validation.js';
import { createInvoice, getInvoices, getInvoice, addPayment, refundPayment, updateInvoice, deleteInvoice } from './billing.controller.js';

const router = Router();
router.use(authenticate, businessScope());

router.get('/', validate(listInvoicesSchema), getInvoices);
router.get('/:id', validate(invoiceIdParamSchema), getInvoice);
router.post('/', validate(createInvoiceSchema), createInvoice);
router.put('/:id', validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', validate(invoiceIdParamSchema), deleteInvoice);
router.post('/:id/payment', validate(addPaymentSchema), addPayment);
router.post('/:id/refund', authorize('super_admin', 'admin', 'manager'), validate(refundPaymentSchema), refundPayment);

export default router;
