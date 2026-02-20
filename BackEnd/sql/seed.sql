INSERT INTO users (user_id, name, email, password, role, created_at, last_login_at, is_deleted)
VALUES
  ('guardian01', 'Guardian User', 'guardian@example.com', '1234', 'GUARDIAN', NOW(), NOW(), FALSE),
  ('admin01', 'SOIN Admin', 'soin123@naver.com', '1234', 'ADMIN', NOW(), NOW(), FALSE)
ON CONFLICT (user_id) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_deleted = FALSE,
    deleted_at = NULL;

INSERT INTO subjects (target_id, guardian_id, name, age, gender, created_at, is_deleted)
VALUES
  ('target-001', 'guardian01', 'Kim Subject', 78, 'F', NOW(), FALSE),
  ('target-002', 'guardian01', 'Lee Subject', 81, 'M', NOW(), FALSE)
ON CONFLICT (target_id) DO UPDATE
SET guardian_id = EXCLUDED.guardian_id,
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    is_deleted = FALSE,
    deleted_at = NULL;

INSERT INTO devices (device_id, serial_number, target_id, status, last_seen_at, installed_at, firmware, is_deleted)
VALUES
  ('device-001', 'SN-001', 'target-001', 'ONLINE', NOW(), NOW(), 'v1.2.4', FALSE),
  ('device-002', 'SN-002', 'target-002', 'OFFLINE', NOW() - INTERVAL '40 minutes', NOW(), 'v1.2.4', FALSE)
ON CONFLICT (device_id) DO UPDATE
SET serial_number = EXCLUDED.serial_number,
    target_id = EXCLUDED.target_id,
    status = EXCLUDED.status,
    last_seen_at = EXCLUDED.last_seen_at,
    firmware = EXCLUDED.firmware,
    is_deleted = FALSE,
    deleted_at = NULL;

INSERT INTO alerts (
  alert_id, target_id, device_id, alert_type, risk_level, title, description, location,
  occurred_at, is_read, status, memo, guardian_notified, is_false_positive
)
VALUES
  ('alert-001', 'target-001', 'device-001', 'FALL', 'HIGH', 'Fall detected', 'A possible fall was detected in the living room.', 'Living room', NOW() - INTERVAL '8 minutes', FALSE, 'UNCONFIRMED', '', FALSE, FALSE),
  ('alert-002', 'target-002', 'device-002', 'INACTIVITY', 'MEDIUM', 'Long inactivity', 'No movement has been detected for over 3 hours.', 'Bedroom', NOW() - INTERVAL '32 minutes', FALSE, 'CONFIRMED', 'Monitoring for another hour', TRUE, FALSE),
  ('alert-003', 'target-001', 'device-001', 'WANDER', 'LOW', 'Movement detected', 'Regular movement near the entrance was detected.', 'Entrance', NOW() - INTERVAL '95 minutes', TRUE, 'RESOLVED', '', TRUE, FALSE)
ON CONFLICT (alert_id) DO UPDATE
SET target_id = EXCLUDED.target_id,
    device_id = EXCLUDED.device_id,
    alert_type = EXCLUDED.alert_type,
    risk_level = EXCLUDED.risk_level,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    occurred_at = EXCLUDED.occurred_at,
    is_read = EXCLUDED.is_read,
    status = EXCLUDED.status,
    memo = EXCLUDED.memo,
    guardian_notified = EXCLUDED.guardian_notified,
    is_false_positive = EXCLUDED.is_false_positive,
    updated_at = NOW();

INSERT INTO environment_readings (target_id, temperature, humidity, measured_at)
VALUES
  ('target-001', 24.0, 46.0, NOW()),
  ('target-002', 23.0, 48.0, NOW());
