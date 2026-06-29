-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('administrator', 'manager', 'cashier', 'storekeeper');
CREATE TYPE invoice_type AS ENUM ('proforma', 'cash_sales');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'part_payment', 'converted', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'part_payment', 'paid');
CREATE TYPE product_category AS ENUM ('tarpaulin', 'carpet', 'centre_rug', 'artificial_grass', 'tent', 'accessory', 'other');
CREATE TYPE product_unit AS ENUM ('meters', 'yards', 'sqm', 'pcs', 'rolls', 'sets');
CREATE TYPE roll_unit AS ENUM ('meters', 'yards', 'sqm');
CREATE TYPE roll_status AS ENUM ('active', 'depleted', 'damaged', 'returned');
CREATE TYPE delivery_status AS ENUM ('pending', 'dispatched', 'in_transit', 'delivered', 'failed');
CREATE TYPE expense_category AS ENUM ('utilities', 'rent', 'salaries', 'transport', 'supplies', 'maintenance', 'marketing', 'other');
CREATE TYPE expense_payment_method AS ENUM ('cash', 'transfer', 'pos', 'cheque');
CREATE TYPE installation_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE installer_role AS ENUM ('lead', 'assistant');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'in_transit', 'completed', 'rejected');

-- ============================================================
-- BRANCHES (without manager FK initially)
-- ============================================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  allowed_ip_ranges TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'cashier',
  branch_id UUID REFERENCES branches(id),
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  allowed_ips TEXT[] DEFAULT '{}',
  can_view_pnl BOOLEAN DEFAULT false,
  can_view_cost_price BOOLEAN DEFAULT false,
  can_edit_price BOOLEAN DEFAULT false,
  can_delete_transactions BOOLEAN DEFAULT false,
  can_approve_discounts BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_view_audit_logs BOOLEAN DEFAULT false,
  can_manage_products BOOLEAN DEFAULT false,
  can_approve_transfers BOOLEAN DEFAULT false,
  can_view_payroll BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add branch manager FK now that users exists
ALTER TABLE branches ADD COLUMN manager_id UUID REFERENCES users(id);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  credit_balance NUMERIC(12,2) DEFAULT 0,
  total_purchases NUMERIC(12,2) DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category product_category DEFAULT 'other',
  unit product_unit DEFAULT 'meters',
  cost_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  minimum_selling_price NUMERIC(12,2) DEFAULT 0,
  wholesale_price NUMERIC(12,2) DEFAULT 0,
  retail_price NUMERIC(12,2) DEFAULT 0,
  has_roll_tracking BOOLEAN DEFAULT false,
  stock NUMERIC(12,2) DEFAULT 0,
  min_stock_level NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  branch_id UUID REFERENCES branches(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROLLS
-- ============================================================
CREATE TABLE rolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_id TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  supplier TEXT,
  initial_balance NUMERIC(12,2) NOT NULL CHECK (initial_balance >= 0),
  remaining_balance NUMERIC(12,2) NOT NULL CHECK (remaining_balance >= 0),
  unit roll_unit DEFAULT 'meters',
  purchase_date TIMESTAMPTZ DEFAULT now(),
  received_date TIMESTAMPTZ DEFAULT now(),
  status roll_status DEFAULT 'active',
  location TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id),
  notes TEXT,
  received_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_code TEXT NOT NULL UNIQUE,
  type invoice_type NOT NULL,
  status invoice_status DEFAULT 'draft',
  payment_status payment_status DEFAULT 'unpaid',
  converted_to_id UUID REFERENCES invoices(id),
  converted_from_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_telephone TEXT,
  customer_address TEXT,
  bill_to TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  validity_date TIMESTAMPTZ,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  discount_reason TEXT,
  discount_approved_by UUID REFERENCES users(id),
  discount_approved_at TIMESTAMPTZ,
  discount_approver_name TEXT,
  vat_rate NUMERIC(5,2) DEFAULT 7.5,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due NUMERIC(12,2) DEFAULT 0,
  deposit_percent INTEGER DEFAULT 70 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  is_supplied BOOLEAN DEFAULT false,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INVOICE ITEMS (line items)
-- ============================================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sn INTEGER,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity >= 0),
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total NUMERIC(12,2) DEFAULT 0,
  product_id UUID REFERENCES products(id),
  roll_id UUID REFERENCES rolls(id),
  roll_id_code TEXT,
  roll_remaining_before NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  user_role TEXT,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  fingerprint TEXT,
  action TEXT,
  resource TEXT,
  resource_id UUID,
  details JSONB,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CUTTING HISTORY
-- ============================================================
CREATE TABLE cutting_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_id UUID NOT NULL REFERENCES rolls(id),
  roll_id_code TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  invoice_code TEXT NOT NULL,
  cut_length NUMERIC(12,2) NOT NULL CHECK (cut_length >= 0),
  unit TEXT DEFAULT 'meters',
  remaining_before NUMERIC(12,2) NOT NULL,
  remaining_after NUMERIC(12,2) NOT NULL,
  cut_by UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_code TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_vehicle TEXT,
  driver_license_number TEXT,
  dispatch_date TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_address TEXT NOT NULL,
  status delivery_status DEFAULT 'pending',
  notes TEXT,
  recipient_name TEXT,
  confirmation_signature TEXT,
  confirmation_photo_url TEXT,
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category expense_category DEFAULT 'other',
  payment_method expense_payment_method DEFAULT 'cash',
  date TIMESTAMPTZ DEFAULT now(),
  branch_id UUID REFERENCES branches(id),
  recorded_by UUID REFERENCES users(id),
  receipt TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INSTALLATIONS
-- ============================================================
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  description TEXT NOT NULL,
  measurement_length NUMERIC(12,2),
  measurement_width NUMERIC(12,2),
  measurement_area NUMERIC(12,2),
  measurement_unit TEXT DEFAULT 'meters',
  scheduled_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  status installation_status DEFAULT 'pending',
  location_address TEXT,
  location_landmark TEXT,
  assigned_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INSTALLATION INSTALLERS
-- ============================================================
CREATE TABLE installation_installers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role installer_role DEFAULT 'assistant',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INSTALLATION TIMELINE
-- ============================================================
CREATE TABLE installation_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  completed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRANSFERS
-- ============================================================
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_code TEXT NOT NULL UNIQUE,
  from_branch_id UUID NOT NULL REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  status transfer_status DEFAULT 'pending',
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRANSFER ITEMS
-- ============================================================
CREATE TABLE transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity >= 1),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OUTSTANDING INVOICES (customer credit tracking)
-- ============================================================
CREATE TABLE customer_outstanding_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount NUMERIC(12,2),
  date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch ON users(branch_id);

CREATE INDEX idx_customers_telephone ON customers(telephone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_credit_balance ON customers(credit_balance);

CREATE INDEX idx_products_name_branch ON products(name, branch_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_rolls_product_status ON rolls(product_id, status);
CREATE INDEX idx_rolls_branch ON rolls(branch_id);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_type_status ON invoices(type, status);
CREATE INDEX idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX idx_invoices_code ON invoices(invoice_code);
CREATE INDEX idx_invoices_deleted ON invoices(is_deleted) WHERE is_deleted = false;

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_invoice_items_roll ON invoice_items(roll_id);

CREATE INDEX idx_audit_logs_event ON audit_logs(event, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);

CREATE INDEX idx_cutting_history_roll ON cutting_history(roll_id);
CREATE INDEX idx_cutting_history_invoice ON cutting_history(invoice_id);
CREATE INDEX idx_cutting_history_created ON cutting_history(created_at DESC);
CREATE INDEX idx_cutting_history_cutby ON cutting_history(cut_by);

CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_invoice ON deliveries(invoice_id);

CREATE INDEX idx_expenses_date_branch ON expenses(date DESC, branch_id);
CREATE INDEX idx_expenses_category ON expenses(category);

CREATE INDEX idx_installations_status ON installations(status);
CREATE INDEX idx_installations_customer ON installations(customer_id);
CREATE INDEX idx_installations_scheduled ON installations(scheduled_date);

CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_branches ON transfers(from_branch_id, to_branch_id);

-- ============================================================
-- RLS POLICIES (InsForge auth)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutting_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_outstanding_invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "authenticated_read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON rolls FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON cutting_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON installations FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON installation_installers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON installation_timeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON transfer_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON customer_outstanding_invoices FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete all data
CREATE POLICY "authenticated_insert" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON rolls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON rolls FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON rolls FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON invoices FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON invoice_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON audit_logs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON cutting_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON cutting_history FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON deliveries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON deliveries FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON installations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON installations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON installations FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON installation_installers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON installation_installers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON installation_installers FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON installation_timeline FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON installation_timeline FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON installation_timeline FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON transfers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON transfers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON transfers FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON transfer_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON transfer_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON transfer_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON branches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON branches FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON customer_outstanding_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON customer_outstanding_invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON customer_outstanding_invoices FOR DELETE TO authenticated USING (true);
