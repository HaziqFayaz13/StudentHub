const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../auth");

const router = express.Router();

// =========================
// GET ALL PREVIOUS PAPERS - SHARED
// =========================
router.get("/", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      id,
      user_id,
      title,
      subject,
      semester,
      exam_year,
      file_name,
      file_type,
      file_size,
      file_data,
      created_at
    FROM previous_papers
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get previous papers error:", err);
      return res.status(500).json({
        message: "Failed to fetch previous papers",
      });
    }

    const papers = results.map((paper) => ({
      id: paper.id,
      userId: paper.user_id,
      isOwner: Number(paper.user_id) === Number(req.user.id),
      title: paper.title,
      subject: paper.subject,
      semester: paper.semester || "",
      year: String(paper.exam_year || ""),
      fileName: paper.file_name || "",
      fileType: paper.file_type || "",
      fileSize: paper.file_size || 0,
      dataUrl: paper.file_data || "",
      createdAt: new Date(paper.created_at).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      ),
    }));

    res.json(papers);
  });
});

// =========================
// ADD PREVIOUS PAPER
// =========================
router.post("/", authenticateToken, (req, res) => {
  const {
    title,
    subject,
    semester,
    year,
    fileName,
    fileType,
    fileSize,
    dataUrl,
  } = req.body;

  if (!title || !subject || !semester || !year) {
    return res.status(400).json({
      message: "Title, subject, semester and year are required",
    });
  }

  const sql = `
    INSERT INTO previous_papers
    (
      user_id,
      title,
      subject,
      semester,
      exam_year,
      file_name,
      file_type,
      file_size,
      file_data
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    req.user.id,
    title.trim(),
    subject,
    semester,
    Number(year),
    fileName || "",
    fileType || "",
    fileSize || 0,
    dataUrl || "",
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Add previous paper error:", err);
      return res.status(500).json({
        message: "Failed to save previous paper",
      });
    }

    res.status(201).json({
      message: "Previous paper uploaded successfully",

      paper: {
        id: result.insertId,
        userId: req.user.id,
        isOwner: true,
        title: title.trim(),
        subject,
        semester,
        year: String(year),
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
// EDIT PREVIOUS PAPER - OWNER ONLY
// =========================
router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const {
    title,
    subject,
    semester,
    year,
  } = req.body;

  if (!title || !subject || !semester || !year) {
    return res.status(400).json({
      message: "Title, subject, semester and year are required",
    });
  }

  const sql = `
    UPDATE previous_papers
    SET
      title = ?,
      subject = ?,
      semester = ?,
      exam_year = ?
    WHERE id = ?
    AND user_id = ?
  `;

  const values = [
    title.trim(),
    subject,
    semester,
    Number(year),
    id,
    req.user.id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Edit previous paper error:", err);
      return res.status(500).json({
        message: "Failed to edit previous paper",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: "You can only edit your own previous papers",
      });
    }

    res.json({
      message: "Previous paper updated successfully",
    });
  });
});

// =========================
// DELETE PREVIOUS PAPER - OWNER ONLY
// =========================
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM previous_papers
    WHERE id = ?
    AND user_id = ?
  `;

  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) {
      console.error("Delete previous paper error:", err);
      return res.status(500).json({
        message: "Failed to delete previous paper",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: "You can only delete your own previous papers",
      });
    }

    res.json({
      message: "Previous paper deleted successfully",
    });
  });
});

module.exports = router;