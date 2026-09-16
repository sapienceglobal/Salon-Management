import { authService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';

/**
 * Cookie options for refresh token.
 * httpOnly: prevents JavaScript access (XSS protection)
 * secure: only sent over HTTPS in production
 * sameSite: prevents CSRF attacks
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/v1/auth', // Only sent to auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * @desc    Register new business + admin user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  ApiResponse.created('Registration successful', {
    user,
    accessToken,
  }).send(res);
});

/**
 * @desc    Login with email & password
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const { email, password, rememberMe } = req.body;

  const { user, accessToken, refreshToken } = await authService.login(
    { email, password },
    ipAddress,
    userAgent
  );

  // Set refresh token as httpOnly cookie
  // If rememberMe is true, it gets a 7-day maxAge. Otherwise, it becomes a session cookie (deleted on browser close)
  const cookieOptions = {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
  };
  if (!rememberMe) {
    delete cookieOptions.maxAge;
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);

  ApiResponse.ok('Login successful', {
    user,
    accessToken,
    refreshToken,
  }).send(res);
});

/**
 * @desc    Refresh access token using refresh token from cookie
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token cookie)
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = req.cookies.refreshToken || req.body.refreshToken;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!refreshTokenFromCookie) {
    return ApiResponse.unauthorized('No refresh token provided').send(res);
  }

  const { user, accessToken, refreshToken } = await authService.refreshToken(
    refreshTokenFromCookie,
    ipAddress,
    userAgent
  );

  // Set new refresh token cookie (rotation)
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  ApiResponse.ok('Token refreshed', {
    user,
    accessToken,
    refreshToken,
  }).send(res);
});

/**
 * @desc    Logout — clear refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;

  // Revoke refresh token in database
  await authService.logout(refreshTokenFromCookie);

  // Clear the cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });

  ApiResponse.ok('Logged out successfully').send(res);
});

/**
 * @desc    Forgot password — send reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  // Always return success (don't reveal if email exists)
  ApiResponse.ok(
    'If an account with that email exists, a password reset link has been sent.'
  ).send(res);
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);

  ApiResponse.ok('Password reset successful. Please login with your new password.').send(res);
});

/**
 * @desc    Change password (for logged-in users)
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.current_password,
    req.body.new_password
  );

  // Clear refresh token cookie (force re-login)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });

  ApiResponse.ok('Password changed successfully. Please login again.').send(res);
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  ApiResponse.ok('User profile fetched', {
    user: req.user,
  }).send(res);
});

/**
 * @desc    Google OAuth redirect
 * @route   GET /api/v1/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res, next) => {
  // Passport handles the redirect to Google
  // This is handled in routes via passport.authenticate('google')
  next();
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
 */
export const googleCallback = asyncHandler(async (req, res) => {
  // If passport authenticated the user, req.user will be set
  if (!req.user) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
  }

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Generate tokens
  const tokens = await authService.generateTokens(req.user, ipAddress, userAgent);

  // Set refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  // Redirect to frontend with access token
  res.redirect(
    `${env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}`
  );
});
