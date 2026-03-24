-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Gestión de Identidad y Roles
CREATE TYPE user_role AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'LEVEL_3',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- 2. Inventario y Motores de Tarifas
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    photos JSONB,
    whatsapp TEXT,
    type TEXT DEFAULT 'hotel',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL
);

-- Matriz de Tarifas por Temporada
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    type TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    room_prices JSONB -- Mapeo { roomId: precio }
);

-- 3. Ventas y Cotizaciones
CREATE TYPE quote_status AS ENUM ('NUEVA', 'BLOQUEADA', 'PAGADA', 'CONFIRMADA');

CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    folio TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    room_id UUID REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    pax INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status quote_status DEFAULT 'NUEVA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE operations (
    id TEXT PRIMARY KEY,
    quote_id TEXT,
    client_name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    hotel_id TEXT,
    hotel_name TEXT NOT NULL,
    hotel_email TEXT,
    check_in DATE NOT NULL,
    check_out DATE,
    room_type TEXT,
    pax TEXT,
    children TEXT,
    infants TEXT,
    total_amount DECIMAL(10, 2),
    companions JSONB,
    technical_sheet JSONB,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id TEXT,
    client_name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    hotel_id TEXT,
    hotel_name TEXT NOT NULL,
    hotel_email TEXT,
    check_in DATE NOT NULL,
    check_out DATE,
    room_type TEXT,
    pax TEXT,
    children TEXT,
    infants TEXT,
    total_amount DECIMAL(10, 2),
    companions JSONB,
    technical_sheet JSONB,
    hotel_response_image TEXT,
    payment_proof_image TEXT,
    status TEXT DEFAULT 'Confirmada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add companions and technical_sheet columns to quotations if they don't exist
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS companions JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS technical_sheet JSONB;

-- 4. Traslados
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route TEXT NOT NULL,
    operator TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    net_cost DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Configuración Web
CREATE TABLE web_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bitácora Append-Only (Audit Trail)
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para bloquear UPDATE y DELETE en audit_trail
CREATE OR REPLACE FUNCTION protect_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no permitida: La tabla audit_trail es estrictamente Append-Only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_audit_log
BEFORE UPDATE OR DELETE ON audit_trail
FOR EACH STATEMENT EXECUTE FUNCTION protect_audit_log();
