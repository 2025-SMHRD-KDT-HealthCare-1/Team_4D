const db = require('../db/pool');

function periodRange(period) {
  if (period === 'month') return "NOW() - INTERVAL '30 days'";
  if (period === 'week') return "NOW() - INTERVAL '7 days'";
  return "NOW() - INTERVAL '1 day'";
}

async function getOverview() {
  const result = await db.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE role = 'GUARDIAN' AND is_deleted = FALSE) AS "totalGuardians",
       (SELECT COUNT(*)::int FROM subjects WHERE is_deleted = FALSE) AS "totalTargets",
       (SELECT COUNT(*)::int FROM devices WHERE is_deleted = FALSE) AS "totalDevices",
       (SELECT COUNT(*)::int FROM devices WHERE is_deleted = FALSE AND status = 'ONLINE') AS "onlineDevices",
       (SELECT COUNT(*)::int FROM alerts WHERE occurred_at::date = NOW()::date AND is_false_positive = FALSE) AS "todayAlertCount",
       (SELECT COUNT(*)::int FROM alerts WHERE is_false_positive = FALSE AND risk_level = 'HIGH' AND is_read = FALSE) AS "highRiskAlertCount",
       0::int AS "alertFailureCount",
       (SELECT COUNT(*)::int FROM devices WHERE is_deleted = FALSE AND status = 'OFFLINE') AS "errorDevices",
       (SELECT COUNT(*)::int FROM devices WHERE is_deleted = FALSE AND status = 'OFFLINE') AS "offlineDevices"`
  );

  return result.rows[0];
}

async function getEvents() {
  const result = await db.query(
    `SELECT
       a.alert_id AS "alertId",
       a.target_id AS "targetId",
       a.device_id AS "deviceId",
       a.alert_type AS "alertType",
       a.risk_level AS "riskLevel",
       a.occurred_at AS "detectedAt",
       a.is_read AS "isRead",
       a.status,
       a.description,
       COALESCE(s.name, a.target_id) AS "targetName",
       COALESCE(a.memo, '') AS memo,
       a.guardian_notified AS "guardianNotified",
       json_build_array(
         json_build_object(
           'at', a.occurred_at,
           'status', a.status,
           'note', 'Detected by system'
         )
       ) AS history
     FROM alerts a
     LEFT JOIN subjects s ON s.target_id = a.target_id
     WHERE a.is_false_positive = FALSE
     ORDER BY a.occurred_at DESC
     LIMIT 100`
  );

  return { items: result.rows };
}

async function getTargets() {
  const base = await db.query(
    `SELECT
       s.target_id AS "targetId",
       s.guardian_id AS "guardianId",
       s.name,
       s.age,
       s.gender,
       s.created_at AS "createdAt",
       'Address not set'::text AS address,
       'Guardian'::text AS "guardianName",
       '010-0000-0000'::text AS "guardianPhone",
       s.is_deleted AS "isDeleted",
       s.deleted_at AS "deletedAt"
     FROM subjects s
     WHERE s.is_deleted = FALSE
     ORDER BY s.created_at DESC`
  );

  const items = [];
  for (const row of base.rows) {
    const stats = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_false_positive = FALSE) AS total,
         COUNT(*) FILTER (WHERE is_false_positive = FALSE AND is_read = FALSE) AS unread,
         COUNT(*) FILTER (WHERE is_false_positive = FALSE AND risk_level = 'HIGH') AS high,
         MAX(occurred_at) AS last_at,
         (ARRAY_AGG(title ORDER BY occurred_at DESC))[1] AS last_title,
         (ARRAY_AGG(risk_level ORDER BY occurred_at DESC))[1] AS last_risk
       FROM alerts
       WHERE target_id = $1`,
      [row.targetId]
    );

    const history = await db.query(
      `SELECT
         alert_id AS id,
         alert_type AS type,
         occurred_at AS at,
         status
       FROM alerts
       WHERE target_id = $1 AND is_false_positive = FALSE
       ORDER BY occurred_at DESC
       LIMIT 5`,
      [row.targetId]
    );

    const s = stats.rows[0];
    const status = s?.last_risk === 'HIGH' ? 'DANGER' : s?.last_risk === 'MEDIUM' ? 'WARNING' : 'SAFE';

    items.push({
      ...row,
      currentStatus: status,
      lastActivityAt: s?.last_at || new Date().toISOString(),
      activeAlertCount: Number(s?.unread || 0),
      lastEventSummary: s?.last_title || 'No recent event',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      notes: '',
      isActive: true,
      guardianLinked: true,
      riskCriteria: 'Derived from latest alerts',
      eventHistory: history.rows,
    });
  }

  return { items };
}

async function getDevices() {
  const base = await db.query(
    `SELECT
       d.device_id AS "deviceId",
       d.target_id AS "targetId",
       d.status,
       d.last_seen_at AS "lastSeenAt",
       d.installed_at AS "installedAt",
       COALESCE(s.name, d.target_id, 'Unassigned') AS "targetName",
       d.firmware,
       d.is_deleted AS "isDeleted",
       d.deleted_at AS "deletedAt"
     FROM devices d
     LEFT JOIN subjects s ON s.target_id = d.target_id
     WHERE d.is_deleted = FALSE
     ORDER BY d.installed_at DESC`
  );

  const items = [];
  for (const row of base.rows) {
    const counts = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE alert_type = 'FALL') AS fall,
         COUNT(*) FILTER (WHERE alert_type = 'WANDER') AS wander,
         COUNT(*) FILTER (WHERE alert_type = 'INACTIVITY') AS inactivity
       FROM alerts
       WHERE device_id = $1 AND is_false_positive = FALSE`,
      [row.deviceId]
    );

    const c = counts.rows[0];

    items.push({
      ...row,
      cameraCount: 1,
      uptime: '1d 2h',
      deviceHealth: row.status === 'ONLINE' ? 'OK' : 'ERROR',
      errorHistory:
        row.status === 'ONLINE'
          ? []
          : [{ at: new Date().toISOString(), code: 'NET-01', detail: 'Network disconnected' }],
      eventStats: [
        { type: 'FALL', count: Number(c?.fall || 0) },
        { type: 'WANDER', count: Number(c?.wander || 0) },
        { type: 'INACTIVITY', count: Number(c?.inactivity || 0) },
      ],
      restartRequestedAt: null,
      isRegistered: true,
    });
  }

  return { items };
}

async function getStatistics(period) {
  const scope = period === 'month' || period === 'week' ? period : 'day';
  const fromExpr = periodRange(scope);

  const typeData = await db.query(
    `SELECT alert_type AS name, COUNT(*)::int AS value
     FROM alerts
     WHERE occurred_at >= ${fromExpr} AND is_false_positive = FALSE
     GROUP BY alert_type
     ORDER BY alert_type`
  );

  const targetStats = await db.query(
    `SELECT
       s.target_id AS id,
       s.name,
       COUNT(a.*)::int AS total,
       COUNT(*) FILTER (WHERE a.risk_level = 'HIGH')::int AS "highRisk",
       COUNT(DISTINCT d.device_id)::int AS devices
     FROM subjects s
     LEFT JOIN alerts a ON a.target_id = s.target_id AND a.is_false_positive = FALSE
     LEFT JOIN devices d ON d.target_id = s.target_id AND d.is_deleted = FALSE
     WHERE s.is_deleted = FALSE
     GROUP BY s.target_id, s.name
     ORDER BY s.created_at DESC`
  );

  return {
    period: scope,
    timeData: [
      { time: '00', events: 2 },
      { time: '04', events: 1 },
      { time: '08', events: 5 },
      { time: '12', events: 3 },
      { time: '16', events: 4 },
      { time: '20', events: 6 },
      { time: '23', events: 2 },
    ],
    typeData: typeData.rows,
    trendData: [
      { label: 'A', fall: 1, wander: 2, inactivity: 3 },
      { label: 'B', fall: 2, wander: 3, inactivity: 2 },
      { label: 'C', fall: 1, wander: 2, inactivity: 4 },
      { label: 'D', fall: 3, wander: 1, inactivity: 2 },
    ],
    errorData: [
      { name: 'Network', value: 1 },
      { name: 'Camera', value: 0 },
      { name: 'Power', value: 0 },
      { name: 'Other', value: 0 },
    ],
    targetStats: targetStats.rows,
  };
}

async function reportFalsePositive(eventId, reason) {
  const result = await db.query(
    `UPDATE alerts
     SET is_false_positive = TRUE,
         false_positive_reason = $2,
         status = 'RESOLVED',
         is_read = TRUE,
         updated_at = NOW()
     WHERE alert_id = $1
     RETURNING alert_id AS "alertId"`,
    [eventId, String(reason || 'No reason provided')]
  );

  if (result.rowCount === 0) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    alertId: result.rows[0].alertId,
    reported: true,
    reason: String(reason || 'No reason provided'),
    reportedAt: new Date().toISOString(),
  };
}

module.exports = {
  getOverview,
  getEvents,
  getTargets,
  getDevices,
  getStatistics,
  reportFalsePositive,
};
