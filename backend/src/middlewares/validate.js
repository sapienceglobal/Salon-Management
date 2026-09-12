import { ApiError } from '../utils/ApiError.js';

/**
 * Zod validation middleware factory.
 * Validates request body, params, and/or query against Zod schemas.
 *
 * @param {Object} schemas - Object containing Zod schemas
 * @param {import('zod').ZodSchema} [schemas.body] - Body validation schema
 * @param {import('zod').ZodSchema} [schemas.params] - Params validation schema
 * @param {import('zod').ZodSchema} [schemas.query] - Query validation schema
 * @returns {Function} Express middleware
 *
 * @example
 * import { z } from 'zod';
 * const createUserSchema = { body: z.object({ email: z.string().email(), name: z.string().min(2) }) };
 * router.post('/users', validate(createUserSchema), createUser);
 */
export const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            location: 'body',
          });
        });
      } else {
        // Replace body with parsed/transformed values
        req.body = result.data;
      }
    }

    // Validate params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            location: 'params',
          });
        });
      } else {
        for (const key of Object.keys(req.params)) {
          delete req.params[key];
        }
        Object.assign(req.params, result.data);
      }
    }

    // Validate query
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            location: 'query',
          });
        });
      } else {
        // Mutate instead of reassign to avoid Express 5 getter errors
        for (const key of Object.keys(req.query)) {
          delete req.query[key];
        }
        Object.assign(req.query, result.data);
      }
    }

    if (errors.length > 0) {
      return next(ApiError.validationError(errors));
    }

    next();
  };
};
