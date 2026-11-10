-- Generated from mapping-fields.csv — TANAME CAR target schema
-- PostgreSQL 16


CREATE TABLE IF NOT EXISTS organizations (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  brand_name text,
  locale varchar(8) DEFAULT 'fr',
  timezone varchar(64) DEFAULT 'Africa/Casablanca',
  date_format varchar(16) DEFAULT 'd/m/Y',
  currency varchar(8) DEFAULT 'MAD',
  logo_path text,
  homepage text DEFAULT 'contracts',
  settings jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS roles (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  by_default boolean DEFAULT false,
  permissions jsonb,
  legacy_uid text UNIQUE,
  legacy_payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS permissions (
  id bigserial PRIMARY KEY,
  role_id bigint REFERENCES roles(id),
  resource text NOT NULL,
  action text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  UNIQUE (role_id, resource, action, scope)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id bigint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS teams (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS team_user (
  team_id bigint NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id bigint;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id bigint;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_uid text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_payload jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_uid_unique ON users(legacy_uid) WHERE legacy_uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS import_batches (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  source_file text,
  source_sha256 char(64),
  imported_at timestamptz,
  imported_by bigint,
  record_count integer DEFAULT 0,
  notes text
);

CREATE TABLE IF NOT EXISTS data_quality_flags (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id bigint NOT NULL,
  code text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  details jsonb,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (entity_type, entity_id, code)
);

CREATE TABLE IF NOT EXISTS potential_duplicate_groups (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  match_key_hash char(64) NOT NULL,
  score numeric(5,2),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS potential_duplicate_members (
  group_id bigint NOT NULL REFERENCES potential_duplicate_groups(id) ON DELETE CASCADE,
  entity_id bigint NOT NULL,
  role text NOT NULL DEFAULT 'candidate',
  PRIMARY KEY (group_id, entity_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id bigserial PRIMARY KEY,
  user_id bigint,
  action text NOT NULL,
  entity_type text,
  entity_id bigint,
  before jsonb,
  after jsonb,
  ip varchar(45),
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sequences (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  entity_type text NOT NULL,
  prefix text,
  next_value bigint NOT NULL DEFAULT 1,
  padding integer NOT NULL DEFAULT 4,
  format text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (name, entity_type)
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backup_runs (
  id bigserial PRIMARY KEY,
  type text NOT NULL,
  started_at timestamptz,
  finished_at timestamptz,
  size_bytes bigint,
  sha256 char(64),
  encrypted boolean DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  notes text
);

CREATE TABLE IF NOT EXISTS media (
  id bigint PRIMARY KEY,
  mediable_type text,
  mediable_id bigint,
  collection text,
  path text,
  sha256 char(64),
  mime varchar(100),
  size_bytes bigint,
  legacy_uid text,
  legacy_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id bigint PRIMARY KEY,
  documentable_type text,
  documentable_id bigint,
  template_id bigint,
  name text,
  path text,
  sha256 char(64),
  mime varchar(100),
  size_bytes bigint,
  legacy_uid text,
  legacy_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_documents (
  id bigint PRIMARY KEY,
  client_id bigint,
  media_id bigint,
  document_type text,
  legacy_uid text,
  legacy_payload jsonb,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS invoice_lines (  id bigint PRIMARY KEY,
  invoice_id bigint,
  designation text,
  item_id bigint,
  unit varchar(20),
  description text,
  unit_price numeric(12,2),
  discount_rate numeric(5,2),
  discount_value numeric(12,2),
  quantity numeric(14,2),
  net_price numeric(12,2),
  vat_rate numeric(5,2),
  vat_value numeric(12,2),
  price numeric(12,2),
  warehouses jsonb,
  line_type varchar(20),
  display_order integer,
  legacy_uid text,
  legacy_payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id bigint PRIMARY KEY,
  quote_id bigint,
  designation text,
  item_id bigint,
  unit varchar(20),
  description text,
  unit_price numeric(12,2),
  discount_rate numeric(5,2),
  discount_value numeric(12,2),
  quantity numeric(14,2),
  net_price numeric(12,2),
  vat_rate numeric(5,2),
  vat_value numeric(12,2),
  price numeric(12,2),
  warehouses jsonb,
  line_type varchar(20),
  display_order integer,
  legacy_uid text,
  legacy_payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  entity_type text CHECK (entity_type IN ('Entities list')),
  page_orientation text CHECK (page_orientation IN ('portrait', 'landscape')),
  page_size text CHECK (page_size IN ('A3', 'A4', 'A5', 'receipt-thermal')),
  template_html text,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS colors (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  hex text,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS vehicle_credits (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  payment_date date,
  amount numeric(12,2),
  observations text,
  vehicle_id bigint,
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS quotes (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  cancelled_at timestamptz,
  client_id bigint,
  due_date date,
  issued_at date,
  discount_percent numeric(5,2),
  discount_value numeric(12,2),
  note text,
  status text CHECK (status IN ('draft', 'confirmed', 'canceled')),
  reference varchar(32) UNIQUE NOT NULL,
  session_ref jsonb,
  subject text,
  subtotal numeric(12,2),
  subtotal_before_discount numeric(12,2),
  total numeric(12,2),
  total_before_discount numeric(12,2),
  validated boolean,
  vat_value numeric(12,2),
  warehouse_ref jsonb,
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS quote_templates (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  entity_type text CHECK (entity_type IN ('Entities list')),
  page_orientation text CHECK (page_orientation IN ('portrait', 'landscape')),
  page_size text CHECK (page_size IN ('A3', 'A4', 'A5', 'receipt-thermal')),
  template_html text,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS invoice_templates (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  entity_type text CHECK (entity_type IN ('Entities list')),
  page_orientation text CHECK (page_orientation IN ('portrait', 'landscape')),
  page_size text CHECK (page_size IN ('A3', 'A4', 'A5', 'receipt-thermal')),
  template_html text,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS invoices (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  cancelled_at timestamptz,
  client_id bigint,
  due_date date,
  issued_at date,
  discount_percent numeric(5,2),
  discount_value numeric(12,2),
  note text,
  status text CHECK (status IN ('draft', 'confirmed', 'canceled')),
  file_reference text,
  reference varchar(32) UNIQUE NOT NULL,
  session_ref jsonb,
  subject text,
  subtotal numeric(12,2),
  subtotal_before_discount numeric(12,2),
  total numeric(12,2),
  total_before_discount numeric(12,2),
  validated boolean,
  vat_value numeric(12,2),
  warehouse_ref jsonb,
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS lessors (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS credit_houses (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS services (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  active boolean,
  barcode varchar(64),
  code text,
  description text,
  name text,
  favorite boolean,
  manage_stock boolean,
  min_stock numeric(14,2),
  price numeric(12,2),
  purchase_price numeric(12,2),
  reference varchar(32) UNIQUE NOT NULL,
  product_type text CHECK (product_type IN ('raw_material', 'compound_product', 'finished_product', 'service')),
  unit text CHECK (unit IN ('mm', 'cm', 'm', 'm2', 'g', 'kg', 'l', 'm3', 'box', 'piece')),
  vat_included boolean,
  vat_rate numeric(5,2),
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS vehicle_categories (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS employees (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  email varchar(255),
  job_title text CHECK (job_title IN ('secretaire', 'agent', 'administration', 'gestionnaire', 'technique', 'finance')),
  last_name text,
  first_name text,
  phone varchar(32),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS communications (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  all_contacts boolean,
  click_count numeric(14,2),
  contact_list jsonb,
  delivered_count numeric(14,2),
  failed_count numeric(14,2),
  message text,
  read_count numeric(14,2),
  reference varchar(32) UNIQUE NOT NULL,
  reply_count numeric(14,2),
  send_at timestamptz,
  sender_ref text CHECK (sender_ref IN ('Sender list')),
  sent_count numeric(14,2),
  status text CHECK (status IN ('planned', 'pending', 'sending', 'pause', 'stop', 'done')),
  subject text,
  tag_list text[],
  template_ref numeric(14,2),
  total_count numeric(14,2),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS configurations (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  entity_type text CHECK (entity_type IN ('Entities list')),
  page_orientation text CHECK (page_orientation IN ('portrait', 'landscape')),
  page_size text CHECK (page_size IN ('A3', 'A4', 'A5', 'receipt-thermal')),
  template_html text,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS contracts (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  first_driver_id bigint,
  second_driver_id bigint,
  deposit numeric(12,2),
  employee_id bigint,
  client_is_main_driver boolean,
  departure_at timestamptz,
  return_at timestamptz,
  deductible numeric(12,2),
  departure_km numeric(14,2),
  return_km numeric(14,2),
  departure_place text,
  return_place text,
  client_id bigint,
  days numeric(14,2),
  note text,
  paid_amount_recorded numeric(12,2),
  daily_rate numeric(12,2),
  total_amount numeric(12,2),
  returned boolean,
  reference varchar(32) UNIQUE NOT NULL,
  remaining_recorded numeric(12,2),
  vehicle_id bigint,
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS clients (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  address text,
  color_hex char(7),
  birth_date date,
  identity_expiry_date date,
  identity_issued_at date,
  email varchar(255),
  identity_number text,
  license_number text,
  last_name text,
  country_id bigint,
  identity_country_id bigint,
  first_name text,
  source_id bigint,
  status text CHECK (status IN ('actif', 'blackliste', 'inactif', 'debiteur')),
  phone varchar(32),
  client_type text CHECK (client_type IN ('particulier', 'entreprise')),
  identity_document_type text CHECK (identity_document_type IN ('cin', 'passport', 'carte_de_sejour', 'ice')),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS maintenance_events (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  km_interval numeric(14,2),
  current_km numeric(14,2),
  next_date date,
  next_km numeric(14,2),
  maintenance_type_id bigint,
  vehicle_id bigint,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS brands (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  brand_id bigint,
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  contract_id bigint,
  payment_method text CHECK (payment_method IN ('espece', 'tpe', 'virement', 'cheque', 'en_ligne')),
  amount numeric(12,2),
  remaining_amount numeric(12,2),
  payment_status text CHECK (payment_status IN ('paye', 'impaye', 'echeancier', 'remboursement')),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS countries (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS reservations (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  category_id bigint,
  client_id bigint,
  employee_id bigint,
  departure_at timestamptz,
  return_at timestamptz,
  description text,
  total_amount numeric(12,2),
  days numeric(14,2),
  daily_rate numeric(12,2),
  reference varchar(32) UNIQUE NOT NULL,
  status text CHECK (status IN ('en_cours', 'confirmee', 'annulee', 'livree')),
  vehicle_id bigint,
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  cancelled_at timestamptz,
  client_id bigint,
  due_date date,
  issued_at date,
  discount_ref jsonb,
  note text,
  status text CHECK (status IN ('draft', 'sent', 'confirmed', 'canceled')),
  payment_method text CHECK (payment_method IN ('online', 'payment_terminal', 'cheque', 'transfer', 'cash', 'credit_note', 'split_payment')),
  reference varchar(32) UNIQUE NOT NULL,
  session_ref jsonb,
  subject text,
  subtotal numeric(12,2),
  subtotal_before_discount numeric(12,2),
  total numeric(12,2),
  total_before_discount numeric(12,2),
  validated boolean,
  vat_value numeric(12,2),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz,
  reference_format varchar(16),
  reference_normalized varchar(32)
);

CREATE TABLE IF NOT EXISTS maintenance_types (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  date_interval numeric(14,2),
  km_interval numeric(14,2),
  name text,
  legacy_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS vehicles (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  credit_down_payment numeric(12,2),
  gearbox text CHECK (gearbox IN ('Automatique', 'Manuel')),
  fuel_type text CHECK (fuel_type IN ('Diesel', 'Essence', 'Hybrid', 'electrique')),
  category_id bigint,
  color_id bigint,
  cpi_ww text,
  first_registration_date date,
  credit_due_date date,
  km numeric(14,2),
  lessor_id bigint,
  credit_house_id bigint,
  brand_id bigint,
  plate_number text,
  operating_mode text CHECK (operating_mode IN ('location', 'sous_location', 'service')),
  model_id bigint,
  chassis_number text,
  credit_months numeric(14,2),
  purchase_price numeric(12,2),
  daily_rate numeric(12,2),
  fiscal_power numeric(14,2),
  status text CHECK (status IN ('en_location', 'disponible', 'en_reparation', 'hors_service')),
  monthly_installment numeric(12,2),
  display_name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id bigint PRIMARY KEY,
  legacy_uid text,
  legacy_payload jsonb,
  import_batch_id bigint,
  data_quality_status text NOT NULL DEFAULT 'ok',
  name text,
  created_at timestamptz,
  created_by bigint,
  updated_at timestamptz
);

ALTER TABLE contract_templates DROP CONSTRAINT IF EXISTS fk_contract_templates_created_by;
ALTER TABLE contract_templates ADD CONSTRAINT fk_contract_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE colors DROP CONSTRAINT IF EXISTS fk_colors_created_by;
ALTER TABLE colors ADD CONSTRAINT fk_colors_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE vehicle_credits DROP CONSTRAINT IF EXISTS fk_vehicle_credits_vehicle_id;
ALTER TABLE vehicle_credits ADD CONSTRAINT fk_vehicle_credits_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) NOT VALID;
ALTER TABLE vehicle_credits DROP CONSTRAINT IF EXISTS fk_vehicle_credits_created_by;
ALTER TABLE vehicle_credits ADD CONSTRAINT fk_vehicle_credits_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_client_id;
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_client_id FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_created_by;
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE quote_templates DROP CONSTRAINT IF EXISTS fk_quote_templates_created_by;
ALTER TABLE quote_templates ADD CONSTRAINT fk_quote_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE invoice_templates DROP CONSTRAINT IF EXISTS fk_invoice_templates_created_by;
ALTER TABLE invoice_templates ADD CONSTRAINT fk_invoice_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_client_id;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client_id FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_created_by;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE lessors DROP CONSTRAINT IF EXISTS fk_lessors_created_by;
ALTER TABLE lessors ADD CONSTRAINT fk_lessors_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE credit_houses DROP CONSTRAINT IF EXISTS fk_credit_houses_created_by;
ALTER TABLE credit_houses ADD CONSTRAINT fk_credit_houses_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE services DROP CONSTRAINT IF EXISTS fk_services_created_by;
ALTER TABLE services ADD CONSTRAINT fk_services_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE vehicle_categories DROP CONSTRAINT IF EXISTS fk_vehicle_categories_created_by;
ALTER TABLE vehicle_categories ADD CONSTRAINT fk_vehicle_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_created_by;
ALTER TABLE employees ADD CONSTRAINT fk_employees_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS fk_communications_created_by;
ALTER TABLE communications ADD CONSTRAINT fk_communications_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE configurations DROP CONSTRAINT IF EXISTS fk_configurations_created_by;
ALTER TABLE configurations ADD CONSTRAINT fk_configurations_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_first_driver_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_first_driver_id FOREIGN KEY (first_driver_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_second_driver_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_second_driver_id FOREIGN KEY (second_driver_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_employee_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_client_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_client_id FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_vehicle_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) NOT VALID;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS fk_contracts_created_by;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_country_id;
ALTER TABLE clients ADD CONSTRAINT fk_clients_country_id FOREIGN KEY (country_id) REFERENCES countries(id) NOT VALID;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_identity_country_id;
ALTER TABLE clients ADD CONSTRAINT fk_clients_identity_country_id FOREIGN KEY (identity_country_id) REFERENCES countries(id) NOT VALID;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_source_id;
ALTER TABLE clients ADD CONSTRAINT fk_clients_source_id FOREIGN KEY (source_id) REFERENCES lead_sources(id) NOT VALID;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_created_by;
ALTER TABLE clients ADD CONSTRAINT fk_clients_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE maintenance_events DROP CONSTRAINT IF EXISTS fk_maintenance_events_maintenance_type_id;
ALTER TABLE maintenance_events ADD CONSTRAINT fk_maintenance_events_maintenance_type_id FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) NOT VALID;
ALTER TABLE maintenance_events DROP CONSTRAINT IF EXISTS fk_maintenance_events_vehicle_id;
ALTER TABLE maintenance_events ADD CONSTRAINT fk_maintenance_events_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) NOT VALID;
ALTER TABLE maintenance_events DROP CONSTRAINT IF EXISTS fk_maintenance_events_created_by;
ALTER TABLE maintenance_events ADD CONSTRAINT fk_maintenance_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS fk_brands_created_by;
ALTER TABLE brands ADD CONSTRAINT fk_brands_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE vehicle_models DROP CONSTRAINT IF EXISTS fk_vehicle_models_brand_id;
ALTER TABLE vehicle_models ADD CONSTRAINT fk_vehicle_models_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id) NOT VALID;
ALTER TABLE vehicle_models DROP CONSTRAINT IF EXISTS fk_vehicle_models_created_by;
ALTER TABLE vehicle_models ADD CONSTRAINT fk_vehicle_models_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_contract_id;
ALTER TABLE payments ADD CONSTRAINT fk_payments_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) NOT VALID;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_created_by;
ALTER TABLE payments ADD CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE countries DROP CONSTRAINT IF EXISTS fk_countries_created_by;
ALTER TABLE countries ADD CONSTRAINT fk_countries_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_category_id;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_category_id FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) NOT VALID;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_client_id;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_client_id FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_employee_id;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) NOT VALID;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_vehicle_id;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) NOT VALID;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_created_by;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE lead_sources DROP CONSTRAINT IF EXISTS fk_lead_sources_created_by;
ALTER TABLE lead_sources ADD CONSTRAINT fk_lead_sources_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS fk_follow_ups_client_id;
ALTER TABLE follow_ups ADD CONSTRAINT fk_follow_ups_client_id FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID;
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS fk_follow_ups_created_by;
ALTER TABLE follow_ups ADD CONSTRAINT fk_follow_ups_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE maintenance_types DROP CONSTRAINT IF EXISTS fk_maintenance_types_created_by;
ALTER TABLE maintenance_types ADD CONSTRAINT fk_maintenance_types_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_category_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_category_id FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_color_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_color_id FOREIGN KEY (color_id) REFERENCES colors(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_lessor_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_lessor_id FOREIGN KEY (lessor_id) REFERENCES lessors(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_credit_house_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_credit_house_id FOREIGN KEY (credit_house_id) REFERENCES credit_houses(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_brand_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_model_id;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_model_id FOREIGN KEY (model_id) REFERENCES vehicle_models(id) NOT VALID;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_created_by;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
ALTER TABLE whatsapp_campaigns DROP CONSTRAINT IF EXISTS fk_whatsapp_campaigns_created_by;
ALTER TABLE whatsapp_campaigns ADD CONSTRAINT fk_whatsapp_campaigns_created_by FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_identity_number ON clients(identity_number);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_operating_mode ON vehicles(operating_mode);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_id ON vehicles(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vehicle_id ON contracts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_contracts_departure_at ON contracts(departure_at);
CREATE INDEX IF NOT EXISTS idx_contracts_return_at ON contracts(return_at);
CREATE INDEX IF NOT EXISTS idx_contracts_returned ON contracts(returned);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_media_mediable_type ON media(mediable_type);
CREATE INDEX IF NOT EXISTS idx_media_mediable_id ON media(mediable_id);
CREATE INDEX IF NOT EXISTS idx_documents_documentable_type ON documents(documentable_type);
CREATE INDEX IF NOT EXISTS idx_documents_documentable_id ON documents(documentable_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_flags_entity_type ON data_quality_flags(entity_type);
CREATE INDEX IF NOT EXISTS idx_data_quality_flags_entity_id ON data_quality_flags(entity_id);

CREATE OR REPLACE VIEW v_contract_financials AS
SELECT c.id,
       c.paid_amount_recorded,
       COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paye'), 0) AS paid_amount_calculated,
       c.remaining_recorded,
       c.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paye'), 0) AS remaining_calculated,
       (c.paid_amount_recorded IS DISTINCT FROM COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paye'), 0)) AS has_mismatch
FROM contracts c
LEFT JOIN payments p ON p.contract_id = c.id
GROUP BY c.id;

CREATE OR REPLACE VIEW v_dashboard_counters AS
SELECT
  (SELECT count(*) FROM contracts WHERE returned = false AND return_at < now()) AS overdue,
  (SELECT count(*) FROM contracts WHERE returned = false AND return_at::date = (now() AT TIME ZONE 'Africa/Casablanca')::date) AS due_today,
  (SELECT count(*) FROM contracts WHERE returned = false AND return_at::date = ((now() AT TIME ZONE 'Africa/Casablanca') + interval '1 day')::date) AS due_tomorrow,
  (SELECT count(*) FROM contracts WHERE returned = false AND return_at::date = ((now() AT TIME ZONE 'Africa/Casablanca') + interval '2 day')::date) AS due_after_tomorrow,
  (SELECT count(*) FROM contracts WHERE returned = false) AS in_rental,
  (SELECT count(*) FROM vehicles WHERE status = 'disponible') AS available,
  (SELECT count(*) FROM vehicles WHERE status = 'en_reparation') AS in_repair;

CREATE OR REPLACE VIEW v_invoice_totals AS
SELECT i.id,
       i.total AS invoice_total,
       COALESCE(SUM(l.net_price + l.vat_value), 0) AS lines_total,
       (i.total IS DISTINCT FROM COALESCE(SUM(l.net_price + l.vat_value), 0)) AS has_mismatch
FROM invoices i
LEFT JOIN invoice_lines l ON l.invoice_id = i.id
GROUP BY i.id;

CREATE OR REPLACE VIEW v_vehicle_status AS
SELECT v.id, v.plate_number, v.status,
       count(c.id) FILTER (WHERE c.returned = false) AS open_contracts
FROM vehicles v
LEFT JOIN contracts c ON c.vehicle_id = v.id
GROUP BY v.id;
