import { customerRepository } from './customers.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject, formatPhone } from '../../utils/helpers.js';

class CustomerService {
  async getAll(businessId, query) {
    return customerRepository.findAll(businessId, query);
  }

  async getById(id, businessId) {
    const customer = await customerRepository.findById(id, businessId);
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }

  async getProfile(id, businessId) {
    const customer = await this.getById(id, businessId);
    const [packages, memberships] = await Promise.all([
      customerRepository.getActivePackages(id),
      customerRepository.getActiveMemberships(id),
    ]);
    return { ...customer, active_packages: packages, active_memberships: memberships };
  }

  async create(businessId, data) {
    if (data.phone) {
      data.phone = formatPhone(data.phone);
      const existing = await customerRepository.findByPhone(data.phone, businessId);
      if (existing) throw ApiError.conflict('A customer with this phone number already exists');
    }
    if (data.email) {
      const existing = await customerRepository.findByEmail(data.email, businessId);
      if (existing) throw ApiError.conflict('A customer with this email already exists');
    }
    return customerRepository.create({ ...data, business_id: businessId });
  }

  async bulkCreate(businessId, customersArray) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < customersArray.length; i++) {
      const data = customersArray[i];
      try {
        if (data.phone) {
          data.phone = formatPhone(data.phone);
          const existing = await customerRepository.findByPhone(data.phone, businessId);
          if (existing) {
            throw new Error('Phone number already exists');
          }
        }
        if (data.email) {
          const existing = await customerRepository.findByEmail(data.email, businessId);
          if (existing) {
            throw new Error('Email already exists');
          }
        }
        await customerRepository.create({ ...data, business_id: businessId });
        results.successful++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          error: err.message || 'Validation/Database error'
        });
      }
    }

    return results;
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId);
    if (data.phone) {
      data.phone = formatPhone(data.phone);
      const existing = await customerRepository.findByPhone(data.phone, businessId);
      if (existing && existing.id !== id) throw ApiError.conflict('Phone number already in use by another customer');
    }
    if (data.email) {
      const existing = await customerRepository.findByEmail(data.email, businessId);
      if (existing && existing.id !== id) throw ApiError.conflict('Email already in use by another customer');
    }
    const cleanData = cleanObject(data);
    return customerRepository.update(id, businessId, cleanData);
  }

  async delete(id, businessId) {
    await this.getById(id, businessId);
    await customerRepository.delete(id, businessId);
  }

  async getVisitHistory(id, businessId) {
    await this.getById(id, businessId);
    return customerRepository.getVisitHistory(id, businessId);
  }

  async getWalletTransactions(id, businessId) {
    await this.getById(id, businessId);
    return customerRepository.getWalletTransactions(id, businessId);
  }

  async getRewardTransactions(id, businessId) {
    await this.getById(id, businessId);
    return customerRepository.getRewardTransactions(id, businessId);
  }

  async getCustomerStats(businessId) {
    const stats = await customerRepository.getNewVsReturning(businessId);
    return {
      new_customers: parseInt(stats?.new_customers || 0, 10),
      returning_customers: parseInt(stats?.returning_customers || 0, 10),
      defected_customers: parseInt(stats?.defected_customers || 0, 10),
      churn: 0 // Churn calculation can be complex, default to 0 for now as per UI request
    };
  }
}

export const customerService = new CustomerService();
