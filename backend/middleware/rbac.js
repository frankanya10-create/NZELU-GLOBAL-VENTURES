const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Role '${userRole}' does not have permission for this resource.`,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

const permission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!req.user.hasPermission(permissionName)) {
      return res.status(403).json({
        message: `Access denied. Missing required permission: ${permissionName}`,
      });
    }

    next();
  };
};

const rolePermissions = {
  administrator: {
    routes: ['*'],
    grants: ['full_access'],
  },
  manager: {
    routes: [
      '/api/dashboard',
      '/api/invoices*',
      '/api/customers*',
      '/api/products*',
      '/api/transfers*',
      '/api/installations*',
      '/api/deliveries*',
    ],
    grants: ['view_inventory', 'approve_transfers', 'generate_invoices', 'view_customers', 'approve_refunds'],
    restricted: ['/api/users*', '/api/audit-logs*', '/api/backup*', '/api/reports/pnl*', '/api/reports/payroll*'],
  },
  cashier: {
    routes: [
      '/api/invoices*',
      '/api/customers*',
      '/api/products*',
      '/api/dashboard/sales*',
    ],
    grants: ['pos_access', 'proforma_access', 'register_customers', 'check_balances'],
    restricted: [
      '/api/products/prices*', '/api/users*', '/api/reports*',
      '/api/transfers*', '/api/inventory*', '/api/expenses*',
    ],
  },
  storekeeper: {
    routes: [
      '/api/products*',
      '/api/rolls*',
      '/api/transfers*',
      '/api/deliveries*',
      '/api/inventory*',
    ],
    grants: ['update_stock', 'record_deliveries', 'initiate_transfers'],
    restricted: [
      '/api/invoices*', '/api/customers*', '/api/reports*',
      '/api/users*', '/api/expenses*', '/api/backup*',
    ],
  },
};

const routeGuard = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const role = req.user.role;
    if (role === 'administrator') return next();

    const config = rolePermissions[role];
    if (!config) {
      return res.status(403).json({ message: 'Invalid role configuration.' });
    }

    const path = req.baseUrl + req.route?.path || req.originalUrl;

    for (const restricted of config.restricted) {
      const pattern = restricted.replace('*', '.*');
      if (new RegExp(`^${pattern}$`).test(path)) {
        return res.status(403).json({
          message: `Access denied. This resource is restricted for ${role}s.`,
        });
      }
    }

    next();
  };
};

module.exports = { rbac, permission, routeGuard, rolePermissions };
