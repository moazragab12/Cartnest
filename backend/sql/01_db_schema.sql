DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('for_sale', 'sold', 'removed','draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    cash_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cash_balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,
    seller_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    status item_status NOT NULL DEFAULT 'for_sale',
    listed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES items(item_id),
    buyer_user_id INT NOT NULL REFERENCES users(user_id),
    seller_user_id INT NOT NULL REFERENCES users(user_id),
    quantity_purchased INT NOT NULL DEFAULT 1 CHECK (quantity_purchased > 0),
    purchase_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    transaction_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposits (
    deposit_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    deposit_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_seller_user_id ON items (seller_user_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions (item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_user_id ON transactions (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_user_id ON transactions (seller_user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits (user_id);

-- Function for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for setting default timestamp on creation
CREATE OR REPLACE FUNCTION set_timestamp_defaults()
RETURNS TRIGGER AS $$
BEGIN
   -- Set created_at if it exists in the table
   IF TG_TABLE_NAME = 'users' THEN
      NEW.created_at = NOW();
   END IF;
   
   -- Set transaction_time if it exists in the table
   IF TG_TABLE_NAME = 'transactions' THEN
      NEW.transaction_time = NOW();
   END IF;
   
   -- Set deposit_time if it exists in the table
   IF TG_TABLE_NAME = 'deposits' THEN
      NEW.deposit_time = NOW();
   END IF;
   
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at column
DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Triggers for setting timestamp defaults on row creation
DO $$ BEGIN
    CREATE TRIGGER set_users_timestamp_defaults BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION set_timestamp_defaults();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_transactions_timestamp_defaults BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION set_timestamp_defaults();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_deposits_timestamp_defaults BEFORE INSERT ON deposits FOR EACH ROW EXECUTE FUNCTION set_timestamp_defaults();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- added for Horizontal partitioning 

-- 1a. USERS → admins vs. regular users
CREATE TABLE IF NOT EXISTS users_admin   (LIKE users INCLUDING ALL);
ALTER TABLE users_admin   ADD CHECK (role = 'admin');

CREATE TABLE IF NOT EXISTS users_regular (LIKE users INCLUDING ALL);
ALTER TABLE users_regular ADD CHECK (role = 'user');

CREATE OR REPLACE VIEW users AS
  SELECT * FROM users_admin
  UNION ALL
  SELECT * FROM users_regular
;

-- 1b. ITEMS → currently for sale vs. everything else
CREATE TABLE IF NOT EXISTS items_for_sale (LIKE items INCLUDING ALL);
ALTER TABLE items_for_sale ADD CHECK (status = 'for_sale');

CREATE TABLE IF NOT EXISTS items_archived (LIKE items INCLUDING ALL);
ALTER TABLE items_archived ADD CHECK (status <> 'for_sale');

CREATE OR REPLACE VIEW items AS
  SELECT * FROM items_for_sale
  UNION ALL
  SELECT * FROM items_archived
;

-- 1c. TRANSACTIONS → first half‑year vs. second half‑year
CREATE TABLE IF NOT EXISTS transactions_h1 (LIKE transactions INCLUDING ALL);
ALTER TABLE transactions_h1 ADD CHECK (transaction_time < DATE '2025-07-01');

CREATE TABLE IF NOT EXISTS transactions_h2 (LIKE transactions INCLUDING ALL);
ALTER TABLE transactions_h2 ADD CHECK (transaction_time >= DATE '2025-07-01');

CREATE OR REPLACE VIEW transactions AS
  SELECT * FROM transactions_h1
  UNION ALL
  SELECT * FROM transactions_h2
;

-- 1d. DEPOSITS → older vs. newer
CREATE TABLE IF NOT EXISTS deposits_old (LIKE deposits INCLUDING ALL);
ALTER TABLE deposits_old ADD CHECK (deposit_time < DATE '2025-07-01');

CREATE TABLE IF NOT EXISTS deposits_new (LIKE deposits INCLUDING ALL);
ALTER TABLE deposits_new ADD CHECK (deposit_time >= DATE '2025-07-01');

CREATE OR REPLACE VIEW deposits AS
  SELECT * FROM deposits_old
  UNION ALL
  SELECT * FROM deposits_new
;