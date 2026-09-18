const express = require("express");
const router = express.Router();
const db = require("./db");
const { authenticateToken } = require("./auth");

// ======================================================
// GET ALL TIMETABLE SLOTS FOR LOGGED-IN USER
// ======================================================

router.get("/", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      id,
      day,
      TIME_FORMAT(start_time, '%H:%i') AS start,
      TIME_FORMAT(end_time, '%H:%i') AS end,
      subject,
      room,
      faculty,
      type
    FROM timetable
    WHERE user_id = ?
    ORDER BY
      FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
      start_time
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Error fetching timetable:", err);
      return res.status(500).json({
        error: "Failed to fetch timetable",
      });
    }

    res.json(results);
  });
});

// ======================================================
// ADD TIMETABLE SLOT
// ======================================================

router.post("/", authenticateToken, (req, res) => {
  const {
    day,
    start,
    end,
    subject,
    room,
    faculty,
    type = "class",
  } = req.body;

  if (!day || !start || !end || !subject) {
    return res.status(400).json({
      error: "Day, start time, end time and subject are required",
    });
  }

  const allowedDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (!allowedDays.includes(day)) {
    return res.status(400).json({
      error: "Invalid day",
    });
  }

  const allowedTypes = ["class", "break", "lunch"];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid timetable type",
    });
  }

  const sql = `
    INSERT INTO timetable
      (day, start_time, end_time, subject, room, faculty, type, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    day,
    start,
    end,
    subject.trim(),
    room ? room.trim() : null,
    faculty ? faculty.trim() : null,
    type,
    req.user.id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error adding timetable slot:", err);
      return res.status(500).json({
        error: "Failed to add timetable slot",
      });
    }

    res.status(201).json({
      id: result.insertId,
      day,
      start,
      end,
      subject: subject.trim(),
      room: room ? room.trim() : "",
      faculty: faculty ? faculty.trim() : "",
      type,
      user_id: req.user.id,
    });
  });
});

// ======================================================
// UPDATE TIMETABLE SLOT
// ======================================================

router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const {
    day,
    start,
    end,
    subject,
    room,
    faculty,
    type = "class",
  } = req.body;

  if (!day || !start || !end || !subject) {
    return res.status(400).json({
      error: "Day, start time, end time and subject are required",
    });
  }

  const allowedDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (!allowedDays.includes(day)) {
    return res.status(400).json({
      error: "Invalid day",
    });
  }

  const allowedTypes = ["class", "break", "lunch"];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid timetable type",
    });
  }

  const sql = `
    UPDATE timetable
    SET
      day = ?,
      start_time = ?,
      end_time = ?,
      subject = ?,
      room = ?,
      faculty = ?,
      type = ?
    WHERE id = ?
      AND user_id = ?
  `;

  const values = [
    day,
    start,
    end,
    subject.trim(),
    room ? room.trim() : null,
    faculty ? faculty.trim() : null,
    type,
    id,
    req.user.id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating timetable slot:", err);
      return res.status(500).json({
        error: "Failed to update timetable slot",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Timetable slot not found",
      });
    }

    res.json({
      id: Number(id),
      day,
      start,
      end,
      subject: subject.trim(),
      room: room ? room.trim() : "",
      faculty: faculty ? faculty.trim() : "",
      type,
    });
  });
});

// ======================================================
// DELETE TIMETABLE SLOT
// ======================================================

router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM timetable
    WHERE id = ?
      AND user_id = ?
  `;

  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) {
      console.error("Error deleting timetable slot:", err);
      return res.status(500).json({
        error: "Failed to delete timetable slot",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Timetable slot not found",
      });
    }

    res.json({
      message: "Timetable slot deleted successfully",
    });
  });
});

// ======================================================
// TEST ROUTE
// ======================================================

router.get("/test", (req, res) => {
  res.json({
    message: "Timetable routes are working",
  });
});

module.exports = router;