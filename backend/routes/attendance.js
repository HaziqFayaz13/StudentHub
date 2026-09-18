const express = require("express");
const router = express.Router();

const db = require("../db");
const { authenticateToken } = require("../auth");

// GET attendance for logged-in user
router.get("/", authenticateToken, (req, res) => {
  const sql = `
    SELECT *
    FROM attendance
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Error fetching attendance:", err);
      return res.status(500).json({
        error: "Failed to fetch attendance",
      });
    }

    res.json(results);
  });
});

// ADD attendance for logged-in user
router.post("/", authenticateToken, (req, res) => {
  const { subject, attended, total } = req.body;

  if (!subject) {
    return res.status(400).json({
      error: "Subject is required",
    });
  }

  const sql = `
    INSERT INTO attendance
    (user_id, subject, attended, total)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [req.user.id, subject, attended, total],
    (err, result) => {
      if (err) {
        console.error("Error adding attendance:", err);
        return res.status(500).json({
          error: "Failed to add attendance",
        });
      }

      res.status(201).json({
        id: result.insertId,
        user_id: req.user.id,
        subject,
        attended,
        total,
      });
    }
  );
});

// UPDATE attendance for logged-in user
router.put("/:id", authenticateToken, (req, res) => {
  const { subject, attended, total } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE attendance
    SET subject = ?, attended = ?, total = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(
    sql,
    [subject, attended, total, id, req.user.id],
    (err, result) => {
      if (err) {
        console.error("Error updating attendance:", err);
        return res.status(500).json({
          error: "Failed to update attendance",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Attendance record not found",
        });
      }

      res.json({
        message: "Attendance updated successfully",
      });
    }
  );
});

// DELETE attendance for logged-in user
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM attendance
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) {
      console.error("Error deleting attendance:", err);
      return res.status(500).json({
        error: "Failed to delete attendance",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Attendance record not found",
      });
    }

    res.json({
      message: "Attendance deleted successfully",
    });
  });
});

module.exports = router;