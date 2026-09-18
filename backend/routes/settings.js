const express = require("express");
const router = express.Router();

const db = require("../db");
const { authenticateToken } = require("../auth");

// GET settings for logged-in user
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      attendance_alerts AS attendanceAlerts,
      class_reminders AS classReminders,
      weekly_digest AS weeklyDigest,
      compact_tables AS compactTables
    FROM user_settings
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching settings:", err);
      return res.status(500).json({
        message: "Failed to fetch settings",
      });
    }

    if (results.length === 0) {
      const defaultSettings = {
        attendanceAlerts: true,
        classReminders: true,
        weeklyDigest: true,
        compactTables: false,
      };

      const insertSql = `
        INSERT INTO user_settings
        (
          user_id,
          attendance_alerts,
          class_reminders,
          weekly_digest,
          compact_tables
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          userId,
          defaultSettings.attendanceAlerts,
          defaultSettings.classReminders,
          defaultSettings.weeklyDigest,
          defaultSettings.compactTables,
        ],
        (insertErr) => {
          if (insertErr) {
            console.error("Error creating settings:", insertErr);
            return res.status(500).json({
              message: "Failed to create settings",
            });
          }

          return res.json(defaultSettings);
        }
      );

      return;
    }

    return res.json(results[0]);
  });
});

// UPDATE settings for logged-in user
router.put("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const {
    attendanceAlerts,
    classReminders,
    weeklyDigest,
    compactTables,
  } = req.body;

  const sql = `
    INSERT INTO user_settings
    (
      user_id,
      attendance_alerts,
      class_reminders,
      weekly_digest,
      compact_tables
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      attendance_alerts = VALUES(attendance_alerts),
      class_reminders = VALUES(class_reminders),
      weekly_digest = VALUES(weekly_digest),
      compact_tables = VALUES(compact_tables)
  `;

  db.query(
    sql,
    [
      userId,
      Boolean(attendanceAlerts),
      Boolean(classReminders),
      Boolean(weeklyDigest),
      Boolean(compactTables),
    ],
    (err) => {
      if (err) {
        console.error("Error updating settings:", err);
        return res.status(500).json({
          message: "Failed to update settings",
        });
      }

      return res.json({
        message: "Settings saved successfully",
        settings: {
          attendanceAlerts: Boolean(attendanceAlerts),
          classReminders: Boolean(classReminders),
          weeklyDigest: Boolean(weeklyDigest),
          compactTables: Boolean(compactTables),
        },
      });
    }
  );
});

module.exports = router;