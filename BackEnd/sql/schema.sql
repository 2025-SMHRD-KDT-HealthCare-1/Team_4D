CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('GUARDIAN','ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subjects (
  target_id TEXT PRIMARY KEY,
  guardian_id TEXT NOT NULL REFERENCES users(user_id),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M','F')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  serial_number TEXT NOT NULL UNIQUE,
  target_id TEXT REFERENCES subjects(target_id),
  status TEXT NOT NULL CHECK (status IN ('ONLINE','OFFLINE')),
  last_seen_at TIMESTAMPTZ,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  firmware TEXT NOT NULL DEFAULT 'v1.0.0',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL REFERENCES subjects(target_id),
  device_id TEXT REFERENCES devices(device_id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('FALL','WANDER','INACTIVITY')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'UNCONFIRMED' CHECK (status IN ('UNCONFIRMED','CONFIRMED','RESOLVED')),
  memo TEXT NOT NULL DEFAULT '',
  guardian_notified BOOLEAN NOT NULL DEFAULT FALSE,
  is_false_positive BOOLEAN NOT NULL DEFAULT FALSE,
  false_positive_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environment_readings (
  id BIGSERIAL PRIMARY KEY,
  target_id TEXT NOT NULL REFERENCES subjects(target_id),
  temperature NUMERIC(5,2) NOT NULL,
  humidity NUMERIC(5,2) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_target_occurred ON alerts(target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_false_positive ON alerts(is_false_positive);
CREATE INDEX IF NOT EXISTS idx_devices_target ON devices(target_id);
CREATE INDEX IF NOT EXISTS idx_subjects_guardian ON subjects(guardian_id);
