import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import passport from './config/passport.js';

// Middlewares
import { requestLogger } from './middlewares/requestLogger.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { sanitize } from './middlewares/sanitize.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { generateToken } from './middlewares/csrf.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import serviceRoutes from './modules/services/services.routes.js';
import productRoutes from './modules/products/products.routes.js';
import appointmentRoutes from './modules/appointments/appointments.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import staffRoutes from './modules/staff/staff.module.js';
import walletRoutes from './modules/wallet/wallet.module.js';
import packageRoutes from './modules/packages/packages.module.js';
import leadRoutes from './modules/leads/leads.module.js';
import expenseRoutes from './modules/expenses/expenses.module.js';
import feedbackRoutes from './modules/feedback/feedback.module.js';
import campaignRoutes from './modules/campaigns/campaigns.module.js';
import dashboardRoutes from './modules/dashboard/dashboard.module.js';
import settingsRoutes from './modules/settings/settings.module.js';
import reportRoutes from './modules/reports/reports.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure the Express application.
 * Separated from server.js for testability.
 */
const app = express();

// ===================================================================
// SECURITY MIDDLEWARES (order matters!)
// ===================================================================

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors(corsOptions));
// app.use(globalLimiter); // Disabled for testing
app.use(hpp());
app.use(compression());

// ===================================================================
// BODY PARSING & COOKIES
// ===================================================================

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ===================================================================
// REQUEST PROCESSING
// ===================================================================

app.use(sanitize);
app.use(requestLogger);
app.use(passport.initialize());

// ===================================================================
// STATIC FILES
// ===================================================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===================================================================
// HEALTH CHECK
// ===================================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Salon360 API is running',
    data: {
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
    },
  });
});

// CSRF token endpoint
app.get('/api/v1/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  res.status(200).json({
    success: true, statusCode: 200,
    message: 'CSRF token generated',
    data: { csrfToken: token },
  });
});

// ===================================================================
// API ROUTES — All 16 Module Routes
// ===================================================================

const API_PREFIX = `/api/${env.API_VERSION}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/invoices`, billingRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/wallet-rewards`, walletRoutes);
app.use(`${API_PREFIX}/catalog`, packageRoutes);
app.use(`${API_PREFIX}/leads`, leadRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/feedback`, feedbackRoutes);
app.use(`${API_PREFIX}/campaigns`, campaignRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);

// ===================================================================
// ERROR HANDLING
// ===================================================================

app.use(notFound);
app.use(errorHandler);

export default app;
