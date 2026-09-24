import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { generateInvoiceNumber, calculateGST } from '../../utils/helpers.js';
import { customerRepository } from '../customers/customers.repository.js';

class BillingService {
  /**
   * Create an invoice with items, calculate taxes, generate invoice number.
   */
  async createInvoice(businessId, userId, data) {
    const invoiceId = await db.transaction(async (trx) => {
      // Get business settings for tax and invoice counter
      const settings = await trx('business_settings').where({ business_id: businessId }).first();
      if (!settings) throw ApiError.internal('Business settings not found');

      // Verify customer
      const customer = await trx('customers').where({ id: data.customer_id, business_id: businessId }).first();
      if (!customer) throw ApiError.notFound('Customer not found');

      // Check active membership for discount
      const membership = await trx('customer_memberships as cm')
        .join('memberships as m', 'cm.membership_id', 'm.id')
        .where({ 'cm.customer_id': data.customer_id, 'cm.status': 'active' })
        .where('cm.end_date', '>=', new Date())
        .select('m.discount_percentage')
        .first();
      const membershipDiscount = membership?.discount_percentage || 0;

      // Process items
      let subtotal = 0;
      let totalTax = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      const invoiceItems = [];

      for (const item of data.items) {
        let itemName = '';
        let unitPrice = item.unit_price || 0;
        let taxPercentage = 0;

        if (item.item_type === 'service') {
          const service = await trx('salon_services').where({ id: item.item_id, business_id: businessId }).first();
          if (!service) throw ApiError.notFound(`Service ID ${item.item_id} not found`);
          itemName = service.name;
          unitPrice = item.unit_price || service.price;
          taxPercentage = service.tax_percentage;
        } else if (item.item_type === 'product') {
          const product = await trx('products').where({ id: item.item_id, business_id: businessId }).first();
          if (!product) throw ApiError.notFound(`Product ID ${item.item_id} not found`);
          if (product.stock_quantity < item.quantity) throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
          itemName = product.name;
          unitPrice = item.unit_price || product.selling_price;
          taxPercentage = product.tax_percentage;
          // Deduct stock if not a draft
          if (data.status !== 'draft') {
            await trx('products').where({ id: item.item_id }).update({
              stock_quantity: db.raw('stock_quantity - ?', [item.quantity]),
              updated_at: db.fn.now(),
            });
          }
        } else if (item.item_type === 'package') {
          const pkg = await trx('packages').where({ id: item.item_id, business_id: businessId }).first();
          if (!pkg) throw ApiError.notFound(`Package ID ${item.item_id} not found`);
          itemName = pkg.name;
          unitPrice = item.unit_price || pkg.total_price;
          taxPercentage = pkg.tax_percentage;
        } else if (item.item_type === 'membership') {
          const mem = await trx('memberships').where({ id: item.item_id, business_id: businessId }).first();
          if (!mem) throw ApiError.notFound(`Membership ID ${item.item_id} not found`);
          itemName = mem.name;
          unitPrice = item.unit_price || mem.price;
          taxPercentage = settings.tax_enabled ? (Number(settings.default_cgst) + Number(settings.default_sgst)) : 0;
        }

        const lineDiscount = Number(item.discount) || 0;
        const safeUnitPrice = Number(unitPrice) || 0;
        const discountedPrice = (safeUnitPrice * item.quantity) - lineDiscount;
        const gst = settings.tax_enabled ? calculateGST(discountedPrice, taxPercentage) : { cgst: 0, sgst: 0, totalTax: 0, amountWithTax: discountedPrice };

        subtotal += discountedPrice;
        totalTax += gst.totalTax;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;

        invoiceItems.push({
          item_type: item.item_type,
          item_id: item.item_id,
          item_name: itemName,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount: lineDiscount,
          tax_percentage: taxPercentage,
          tax_amount: gst.totalTax,
          total_price: gst.amountWithTax,
          staff_member_id: item.staff_member_id || null,
        });
      }

      // Apply invoice-level discount
      let invoiceDiscount = 0;
      if (data.discount_amount && data.discount_type) {
        invoiceDiscount = data.discount_type === 'percentage'
          ? (subtotal * data.discount_amount / 100)
          : data.discount_amount;
      }
      // Apply membership discount
      if (membershipDiscount > 0 && invoiceDiscount === 0) {
        invoiceDiscount = subtotal * membershipDiscount / 100;
      }

      const totalAmount = parseFloat((subtotal + totalTax - invoiceDiscount + (data.tip_amount || 0)).toFixed(2));
      const invoiceNumber = data.status === 'draft' ? `DRAFT-${Date.now()}` : generateInvoiceNumber(settings.invoice_prefix, settings.invoice_counter);

      // Create invoice
      const [invoiceId] = await trx('invoices').insert({
        business_id: businessId,
        invoice_number: invoiceNumber,
        customer_id: data.customer_id,
        appointment_id: data.appointment_id || null,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(invoiceDiscount.toFixed(2)),
        discount_type: data.discount_type || null,
        tax_amount: parseFloat(totalTax.toFixed(2)),
        cgst_amount: parseFloat(totalCgst.toFixed(2)),
        sgst_amount: parseFloat(totalSgst.toFixed(2)),
        total_amount: totalAmount,
        paid_amount: 0,
        due_amount: totalAmount,
        tip_amount: data.tip_amount || 0,
        status: data.status || 'unpaid',
        payment_status: 'pending',
        notes: data.notes || null,
        created_by: userId,
      });

      // Insert invoice items
      const items = invoiceItems.map(i => ({ ...i, invoice_id: invoiceId }));
      await trx('invoice_items').insert(items);

      // Increment invoice counter
      if (data.status !== 'draft') {
        await trx('business_settings').where({ business_id: businessId }).update({
          invoice_counter: settings.invoice_counter + 1,
          updated_at: db.fn.now(),
        });
      }

      // Link appointment to invoice if provided
      if (data.appointment_id) {
        await trx('appointments').where({ id: data.appointment_id, business_id: businessId }).update({ invoice_id: invoiceId, updated_at: db.fn.now() });
      }

      logger.info(`Invoice ${invoiceNumber} created for customer ${data.customer_id} (total: ₹${totalAmount})`);
      return invoiceId;
    });

    return this.getById(invoiceId, businessId);
  }

  /**
   * Update an existing draft invoice.
   */
  async updateInvoice(invoiceId, businessId, userId, data) {
    await db.transaction(async (trx) => {
      const invoice = await trx('invoices').where({ id: invoiceId, business_id: businessId }).first();
      if (!invoice) throw ApiError.notFound('Invoice not found');
      if (invoice.status !== 'draft') throw ApiError.badRequest('Only draft invoices can be updated');

      const settings = await trx('business_settings').where({ business_id: businessId }).first();
      const customer = await trx('customers').where({ id: data.customer_id, business_id: businessId }).first();
      if (!customer) throw ApiError.notFound('Customer not found');

      const membership = await trx('customer_memberships as cm')
        .join('memberships as m', 'cm.membership_id', 'm.id')
        .where({ 'cm.customer_id': data.customer_id, 'cm.status': 'active' })
        .where('cm.end_date', '>=', new Date())
        .select('m.discount_percentage')
        .first();
      const membershipDiscount = membership?.discount_percentage || 0;

      let subtotal = 0;
      let totalTax = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      const invoiceItems = [];

      // Revert product stock for old items
      const oldItems = await trx('invoice_items').where({ invoice_id: invoiceId, item_type: 'product' });
      for (const item of oldItems) {
        await trx('products').where({ id: item.item_id }).update({
          stock_quantity: db.raw('stock_quantity + ?', [item.quantity]),
        });
      }

      await trx('invoice_items').where({ invoice_id: invoiceId }).del();

      for (const item of data.items) {
        let itemName = '';
        let unitPrice = item.unit_price || 0;
        let taxPercentage = 0;

        if (item.item_type === 'service') {
          const service = await trx('salon_services').where({ id: item.item_id, business_id: businessId }).first();
          if (!service) throw ApiError.notFound(`Service ID ${item.item_id} not found`);
          itemName = service.name;
          unitPrice = item.unit_price || service.price;
          taxPercentage = service.tax_percentage;
        } else if (item.item_type === 'product') {
          const product = await trx('products').where({ id: item.item_id, business_id: businessId }).first();
          if (!product) throw ApiError.notFound(`Product ID ${item.item_id} not found`);
          if (product.stock_quantity < item.quantity) throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
          itemName = product.name;
          unitPrice = item.unit_price || product.selling_price;
          taxPercentage = product.tax_percentage;
          
          if (data.status !== 'draft') {
            await trx('products').where({ id: item.item_id }).update({
              stock_quantity: db.raw('stock_quantity - ?', [item.quantity]),
            });
          }
        } else if (item.item_type === 'package') {
          const pkg = await trx('packages').where({ id: item.item_id, business_id: businessId }).first();
          if (!pkg) throw ApiError.notFound(`Package ID ${item.item_id} not found`);
          itemName = pkg.name;
          unitPrice = item.unit_price || pkg.total_price;
          taxPercentage = pkg.tax_percentage;
        } else if (item.item_type === 'membership') {
          const mem = await trx('memberships').where({ id: item.item_id, business_id: businessId }).first();
          if (!mem) throw ApiError.notFound(`Membership ID ${item.item_id} not found`);
          itemName = mem.name;
          unitPrice = item.unit_price || mem.price;
          taxPercentage = settings.tax_enabled ? (settings.default_cgst + settings.default_sgst) : 0;
        }

        const lineDiscount = item.discount || 0;
        const discountedPrice = unitPrice * item.quantity - lineDiscount;
        const gst = settings.tax_enabled ? calculateGST(discountedPrice, taxPercentage) : { cgst: 0, sgst: 0, totalTax: 0, amountWithTax: discountedPrice };

        subtotal += discountedPrice;
        totalTax += gst.totalTax;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;

        invoiceItems.push({
          item_type: item.item_type,
          item_id: item.item_id,
          item_name: itemName,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount: lineDiscount,
          tax_percentage: taxPercentage,
          tax_amount: gst.totalTax,
          total_price: gst.amountWithTax,
          staff_member_id: item.staff_member_id || null,
        });
      }

      let invoiceDiscount = 0;
      if (data.discount_amount && data.discount_type) {
        invoiceDiscount = data.discount_type === 'percentage' ? (subtotal * data.discount_amount / 100) : data.discount_amount;
      }
      if (membershipDiscount > 0 && invoiceDiscount === 0) {
        invoiceDiscount = subtotal * membershipDiscount / 100;
      }

      const totalAmount = parseFloat((subtotal + totalTax - invoiceDiscount + (data.tip_amount || 0)).toFixed(2));

      let updatePayload = {
        customer_id: data.customer_id,
        appointment_id: data.appointment_id || null,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(invoiceDiscount.toFixed(2)),
        discount_type: data.discount_type || null,
        tax_amount: parseFloat(totalTax.toFixed(2)),
        cgst_amount: parseFloat(totalCgst.toFixed(2)),
        sgst_amount: parseFloat(totalSgst.toFixed(2)),
        total_amount: totalAmount,
        due_amount: totalAmount,
        tip_amount: data.tip_amount || 0,
        status: data.status || 'draft',
        notes: data.notes || null,
        updated_at: db.fn.now(),
      };

      if (data.status !== 'draft' && invoice.invoice_number.startsWith('DRAFT-')) {
        updatePayload.invoice_number = generateInvoiceNumber(settings.invoice_prefix, settings.invoice_counter);
        
        await trx('business_settings').where({ business_id: businessId }).update({
          invoice_counter: settings.invoice_counter + 1,
          updated_at: db.fn.now(),
        });
      }

      await trx('invoices').where({ id: invoiceId }).update(updatePayload);

      const items = invoiceItems.map(i => ({ ...i, invoice_id: invoiceId }));
      await trx('invoice_items').insert(items);

      if (data.appointment_id) {
        await trx('appointments').where({ id: data.appointment_id, business_id: businessId }).update({ invoice_id: invoiceId, updated_at: db.fn.now() });
      }

      logger.info(`Invoice ${invoice.invoice_number} updated (total: ₹${totalAmount})`);
      return invoiceId;
    });

    return this.getById(invoiceId, businessId);
  }

  /**
   * Delete a draft invoice.
   */
  async deleteInvoice(invoiceId, businessId) {
    return db.transaction(async (trx) => {
      const invoice = await trx('invoices').where({ id: invoiceId, business_id: businessId }).first();
      if (!invoice) throw ApiError.notFound('Invoice not found');
      if (invoice.status !== 'draft') throw ApiError.badRequest('Only draft invoices can be deleted');

      // Revert product stock
      const oldItems = await trx('invoice_items').where({ invoice_id: invoiceId, item_type: 'product' });
      for (const item of oldItems) {
        await trx('products').where({ id: item.item_id }).update({
          stock_quantity: db.raw('stock_quantity + ?', [item.quantity]),
        });
      }

      await trx('invoice_items').where({ invoice_id: invoiceId }).del();
      await trx('invoices').where({ id: invoiceId }).del();

      logger.info(`Draft Invoice ${invoiceId} deleted`);
      return { success: true };
    });
  }

  async getAll(businessId, query) {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const base = db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .where('i.business_id', businessId);

    if (query.status) base.where('i.status', query.status);
    if (query.customer_id) base.where('i.customer_id', query.customer_id);
    if (query.start_date) base.where('i.created_at', '>=', query.start_date);
    if (query.end_date) base.where('i.created_at', '<=', `${query.end_date} 23:59:59`);

    const [{ count }] = await base.clone().count('* as count');
    const rawInvoices = await base.clone()
      .select('i.*', 'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone')
      .orderBy('i.created_at', 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);
      
    const invoices = rawInvoices.map(invoice => {
      invoice.customer = {
        id: invoice.customer_id,
        first_name: invoice.customer_first_name,
        last_name: invoice.customer_last_name,
        phone: invoice.customer_phone,
      };
      delete invoice.customer_first_name;
      delete invoice.customer_last_name;
      delete invoice.customer_phone;
      return invoice;
    });

    return { invoices, meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: parseInt(count, 10), totalPages: Math.ceil(parseInt(count, 10) / parseInt(limit, 10)) } };
  }

  async getById(id, businessId) {
    const invoice = await db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .where({ 'i.id': id, 'i.business_id': businessId })
      .select('i.*', 'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone', 'c.email as customer_email', 'c.gst_number as customer_gst_number')
      .first();
    if (!invoice) throw ApiError.notFound('Invoice not found');

    invoice.items = await db('invoice_items as ii')
      .leftJoin('staff_members as sm', 'ii.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .where('ii.invoice_id', id)
      .select('ii.*', 'u.first_name as staff_name');

    invoice.payments = await db('payments').where({ invoice_id: id }).orderBy('created_at', 'asc');

    // Format customer object for frontend
    invoice.customer = {
      id: invoice.customer_id,
      first_name: invoice.customer_first_name,
      last_name: invoice.customer_last_name,
      phone: invoice.customer_phone,
      email: invoice.customer_email,
      gst_number: invoice.customer_gst_number,
    };
    
    // Clean up flat fields
    delete invoice.customer_first_name;
    delete invoice.customer_last_name;
    delete invoice.customer_phone;
    delete invoice.customer_email;
    delete invoice.customer_gst_number;

    return invoice;
  }

  /**
   * Add payment to an invoice. Handles partial/full payments and wallet deduction.
   */
  async addPayment(invoiceId, businessId, userId, data) {
    await db.transaction(async (trx) => {
      const invoice = await trx('invoices').where({ id: invoiceId, business_id: businessId }).first();
      if (!invoice) throw ApiError.notFound('Invoice not found');
      if (invoice.status === 'paid' || invoice.status === 'cancelled') throw ApiError.badRequest(`Invoice is already ${invoice.status}`);
      if (data.amount > invoice.due_amount) throw ApiError.badRequest('Payment amount exceeds due amount');

      // Handle wallet payment
      if (data.payment_method === 'wallet') {
        const customer = await trx('customers').where({ id: invoice.customer_id }).first();
        if (customer.wallet_balance < data.amount) throw ApiError.badRequest('Insufficient wallet balance');
        await trx('customers').where({ id: invoice.customer_id }).update({
          wallet_balance: db.raw('wallet_balance - ?', [data.amount]),
          updated_at: db.fn.now(),
        });
        await trx('wallet_transactions').insert({
          customer_id: invoice.customer_id,
          business_id: businessId,
          type: 'debit',
          amount: data.amount,
          balance_after: customer.wallet_balance - data.amount,
          description: `Payment for invoice #${invoice.invoice_number}`,
          reference_type: 'payment',
          reference_id: invoiceId,
          created_by: userId,
        });
      }

      // Record payment
      await trx('payments').insert({
        business_id: businessId,
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        amount: data.amount,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id || null,
        status: 'success',
        processed_by: userId,
      });

      // Update invoice amounts
      const currentPaid = parseFloat(invoice.paid_amount) || 0;
      const currentTotal = parseFloat(invoice.total_amount) || 0;
      const paymentAmount = parseFloat(data.amount) || 0;
      
      const newPaidAmount = parseFloat((currentPaid + paymentAmount).toFixed(2));
      const newDueAmount = parseFloat((currentTotal - newPaidAmount).toFixed(2));
      const newStatus = newDueAmount <= 0 ? 'paid' : 'partial';

      await trx('invoices').where({ id: invoiceId }).update({
        paid_amount: newPaidAmount,
        due_amount: Math.max(0, newDueAmount),
        status: newStatus,
        payment_status: newDueAmount <= 0 ? 'completed' : 'partial',
        updated_at: db.fn.now(),
      });

      // If fully paid, update customer stats and add reward points
      if (newStatus === 'paid') {
        await trx('customers').where({ id: invoice.customer_id }).update({
          total_spent: db.raw('total_spent + ?', [invoice.total_amount]),
          total_visits: db.raw('total_visits + 1'),
          last_visit_at: db.fn.now(),
          updated_at: db.fn.now(),
        });

        // Add reward points
        const settings = await trx('business_settings').where({ business_id: businessId }).first();
        if (settings && settings.reward_points_per_100 > 0) {
          const points = Math.floor(invoice.total_amount / 100) * settings.reward_points_per_100;
          if (points > 0) {
            const customer = await trx('customers').where({ id: invoice.customer_id }).first();
            await trx('customers').where({ id: invoice.customer_id }).update({
              reward_points: db.raw('reward_points + ?', [points]),
            });
            await trx('reward_transactions').insert({
              customer_id: invoice.customer_id,
              business_id: businessId,
              type: 'earned',
              points,
              balance_after: customer.reward_points + points,
              description: `Earned for invoice #${invoice.invoice_number}`,
              reference_type: 'invoice',
              reference_id: invoiceId,
            });
          }
        }

        // Calculate and record staff commissions
        const invoiceItems = await trx('invoice_items').where({ invoice_id: invoiceId }).whereNotNull('staff_member_id');
        for (const item of invoiceItems) {
          const staff = await trx('staff_members').where({ id: item.staff_member_id }).first();
          if (staff && staff.commission_profile_id) {
            const profile = await trx('commission_profiles').where({ id: staff.commission_profile_id, is_active: true }).first();
            if (profile) {
              let commissionAmount = 0;
              if (profile.type === 'flat') commissionAmount = profile.value;
              else if (profile.type === 'percentage') commissionAmount = (item.total_price * profile.value) / 100;
              if (commissionAmount > 0) {
                await trx('staff_commissions').insert({
                  staff_member_id: item.staff_member_id,
                  business_id: businessId,
                  invoice_id: invoiceId,
                  invoice_item_id: item.id,
                  commission_amount: parseFloat(commissionAmount.toFixed(2)),
                  status: 'pending',
                });
              }
            }
          }
        }
      }

      logger.info(`Payment ₹${data.amount} added to invoice #${invoice.invoice_number} (method: ${data.payment_method})`);
      return invoiceId;
    });

    return this.getById(invoiceId, businessId);
  }

  /**
   * Refund a payment.
   */
  async refundPayment(invoiceId, businessId, userId, data) {
    await db.transaction(async (trx) => {
      const payment = await trx('payments').where({ id: data.payment_id, invoice_id: invoiceId }).first();
      if (!payment) throw ApiError.notFound('Payment not found');
      if (payment.status === 'refunded') throw ApiError.badRequest('Payment already refunded');
      if (data.amount > payment.amount) throw ApiError.badRequest('Refund amount exceeds payment amount');

      // Mark payment as refunded
      await trx('payments').where({ id: data.payment_id }).update({
        status: 'refunded',
        refund_amount: data.amount,
        refund_reason: data.reason,
      });

      // Update invoice
      const invoice = await trx('invoices').where({ id: invoiceId }).first();
      const currentPaid = parseFloat(invoice.paid_amount) || 0;
      const currentTotal = parseFloat(invoice.total_amount) || 0;
      const refundAmount = parseFloat(data.amount) || 0;
      
      const newPaid = parseFloat((currentPaid - refundAmount).toFixed(2));
      await trx('invoices').where({ id: invoiceId }).update({
        paid_amount: Math.max(0, newPaid),
        due_amount: parseFloat((currentTotal - Math.max(0, newPaid)).toFixed(2)),
        status: 'refunded',
        payment_status: 'refunded',
        updated_at: db.fn.now(),
      });

      // If wallet payment, credit back
      if (payment.payment_method === 'wallet') {
        const customer = await trx('customers').where({ id: invoice.customer_id }).first();
        await trx('customers').where({ id: invoice.customer_id }).update({
          wallet_balance: db.raw('wallet_balance + ?', [data.amount]),
          updated_at: db.fn.now(),
        });
        await trx('wallet_transactions').insert({
          customer_id: invoice.customer_id,
          business_id: businessId,
          type: 'credit',
          amount: data.amount,
          balance_after: customer.wallet_balance + data.amount,
          description: `Refund for invoice #${invoice.invoice_number}`,
          reference_type: 'refund',
          reference_id: invoiceId,
          created_by: userId,
        });
      }

      logger.info(`Refund ₹${data.amount} processed for invoice #${invoice.invoice_number}`);
      return invoiceId;
    });

    return this.getById(invoiceId, businessId);
  }
}

export const billingService = new BillingService();
