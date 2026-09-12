/**
 * Wraps async route handlers to catch errors and pass to Express error handler.
 * Eliminates the need for try-catch blocks in every controller method.
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} - Express middleware function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   ApiResponse.ok('Users fetched', users).send(res);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { asyncHandler };
