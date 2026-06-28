const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.4']);

dotenv.config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const rollRoutes = require('./routes/rolls');
const invoiceRoutes = require('./routes/invoices');
const customerRoutes = require('./routes/customers');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const transferRoutes = require('./routes/transfers');
const expenseRoutes = require('./routes/expenses');
const installationRoutes = require('./routes/installations');
const deliveryRoutes = require('./routes/deliveries');
const auditLogRoutes = require('./routes/auditLogs');
const branchRoutes = require('./routes/branches');

const app = express();

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
    ].filter(Boolean);

    // Allow Vercel deployment URLs (*.vercel.app) and any custom domain set in env
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/', limiter);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rolls', rollRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/branches', branchRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'NGV ERP API',
    version: '1.0.0',
    description: 'NGV Enterprise Resource Planning & Inventory Management System',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      rolls: '/api/rolls',
      invoices: '/api/invoices',
      customers: '/api/customers',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      transfers: '/api/transfers',
      expenses: '/api/expenses',
      installations: '/api/installations',
      deliveries: '/api/deliveries',
      auditLogs: '/api/audit-logs',
      branches: '/api/branches',
      health: '/api/health',
    },
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NGV ERP Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

module.exports = app;
