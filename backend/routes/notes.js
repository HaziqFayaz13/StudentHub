const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../auth");

const router = express.Router();

// =========================
// GET ALL NOTES - SHARED
// =========================
router.get("/", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      id,
      user_id,
      title,
      subject,
      description,
      file_name,
      file_type,
      file_size,
      file_data,
      created_at
    FROM notes
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get notes error:", err);
      return res.status(500).json({
        message: "Failed to fetch notes",
      });
    }

    const notes = results.map((note) => ({
      id: note.id,
      userId: note.user_id,
      isOwner: Number(note.user_id) === Number(req.user.id),
      title: note.title,
      subject: note.subject,
      description: note.description || "",
      fileName: note.file_name || "",
      fileType: note.file_type || "",
      fileSize: note.file_size || 0,
      dataUrl: note.file_data || "",
      createdAt: new Date(note.created_at).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      ),
    }));

    res.json(notes);
  });
});

// =========================
// ADD NOTE
// =========================
router.post("/", authenticateToken, (req, res) => {
  const {
    title,
    subject,
    description,
    fileName,
    fileType,
    fileSize,
    dataUrl,
  } = req.body;

  if (!title || !subject) {
    return res.status(400).json({
      message: "Title and subject are required",
    });
  }

  const sql = `
    INSERT INTO notes
    (
      user_id,
      title,
      subject,
      description,
      file_name,
      file_type,
      file_size,
      file_data
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    req.user.id,
    title.trim(),
    subject,
    description ? description.trim() : "",
    fileName || "",
    fileType || "",
    fileSize || 0,
    dataUrl || "",
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Add note error:", err);
      return res.status(500).json({
        message: "Failed to save note",
      });
    }

    res.status(201).json({
      message: "Note uploaded successfully",
      note: {
        id: result.insertId,
        userId: req.user.id,
        isOwner: true,
        title: title.trim(),
        subject,
        description: description ? description.trim() : "",
        fileName: fileName || "",
        fileType: fileType || "",
        fileSize: fileSize || 0,
        dataUrl: dataUrl || "",
        createdAt: new Date().toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        ),
      },
    });
  });
});

// =========================
// EDIT NOTE - OWNER ONLY
// =========================
router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const {
    title,
    subject,
    description,
  } = req.body;

  if (!title || !subject) {
    return res.status(400).json({
      message: "Title and subject are required",
    });
  }

  const sql = `
    UPDATE notes
    SET
      title = ?,
      subject = ?,
      description = ?
    WHERE id = ?
    AND user_id = ?
  `;

  const values = [
    title.trim(),
    subject,
    description ? description.trim() : "",
    id,
    req.user.id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Edit note error:", err);
      return res.status(500).json({
        message: "Failed to edit note",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: "You can only edit your own notes",
      });
    }

    res.json({
      message: "Note updated successfully",
    });
  });
});

// =========================
// DELETE NOTE - OWNER ONLY
// =========================
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM notes
    WHERE id = ?
    AND user_id = ?
  `;

  db.query(
    sql,
    [id, req.user.id],
    (err, result) => {
      if (err) {
        console.error("Delete note error:", err);
        return res.status(500).json({
          message: "Failed to delete note",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "You can only delete your own notes",
        });
      }

      res.json({
        message: "Note deleted successfully",
      });
    }
  );
});

module.exports = router;