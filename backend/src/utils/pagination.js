import { PAGINATION } from './constants.js';

/**
 * Parse and validate pagination parameters from request query.
 * Enforces maximum limit to prevent abuse.
 *
 * @param {Object} query - Express request query object
 * @returns {Object} - { page, limit, offset }
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  // Enforce boundaries
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination metadata for API responses.
 *
 * @param {number} total - Total number of records
 * @param {number} page - Current page number
 * @param {number} limit - Records per page
 * @returns {Object} - Pagination meta object
 */
export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Apply sorting to a Knex query builder.
 *
 * @param {Object} queryBuilder - Knex query builder instance
 * @param {string} sortBy - Field name to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @param {Array<string>} allowedFields - Whitelist of sortable field names
 * @param {string} [defaultSort='created_at'] - Default sort field
 * @returns {Object} - Modified query builder
 */
export function applySorting(queryBuilder, sortBy, sortOrder, allowedFields, defaultSort = 'created_at') {
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : defaultSort;
  const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

  return queryBuilder.orderBy(validSortBy, validSortOrder);
}
