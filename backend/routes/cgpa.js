const express = require("express");
const router = express.Router();

const db = require("../db");
const { authenticateToken } = require("../auth");

// ==========================================
// GET ALL CGPA DATA FOR LOGGED-IN USER
// ==========================================
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      s.id AS semester_id,
      s.name AS semester_name,

      c.id AS course_id,
      c.name AS course_name,
      c.credits,
      c.grade,
      c.grade_point,

      c.internal_obtained,
      c.internal_total,
      c.external_obtained,
      c.external_total,
      c.practical_internal_obtained,
      c.practical_internal_total,
      c.practical_external_obtained,
      c.practical_external_total

    FROM semesters s

    LEFT JOIN courses c
      ON s.id = c.semester_id
      AND c.user_id = ?

    WHERE s.user_id = ?

    ORDER BY s.id ASC, c.id ASC
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching CGPA data:", err);

      return res.status(500).json({
        error: "Failed to fetch CGPA data",
      });
    }

    res.json(results);
  });
});

// ==========================================
// ADD SEMESTER
// ==========================================
router.post("/semester", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Semester name is required",
    });
  }

  const sql = `
    INSERT INTO semesters (name, user_id)
    VALUES (?, ?)
  `;

  db.query(sql, [name.trim(), userId], (err, result) => {
    if (err) {
      console.error("Error adding semester:", err);

      return res.status(500).json({
        error: "Failed to add semester",
      });
    }

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      user_id: userId,
    });
  });
});

// ==========================================
// ADD COURSE
// ==========================================
router.post(
  "/semester/:semesterId/course",
  authenticateToken,
  (req, res) => {
    const userId = req.user.id;
    const semesterId = req.params.semesterId;

    const {
      name,
      credits,
      grade,
      grade_point,
      internal_obtained,
      internal_total,
      external_obtained,
      external_total,
      practical_internal_obtained,
      practical_internal_total,
      practical_external_obtained,
      practical_external_total,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Course name is required",
      });
    }

    if (!credits || Number(credits) <= 0) {
      return res.status(400).json({
        error: "Credits must be greater than 0",
      });
    }

    if (
      grade_point === undefined ||
      grade_point === null ||
      grade_point === "" ||
      Number(grade_point) < 0 ||
      Number(grade_point) > 10
    ) {
      return res.status(400).json({
        error: "Grade point must be between 0 and 10",
      });
    }

    // Check that semester belongs to logged-in user
    const checkSql = `
      SELECT id
      FROM semesters
      WHERE id = ? AND user_id = ?
    `;

    db.query(
      checkSql,
      [semesterId, userId],
      (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Error checking semester:", checkErr);

          return res.status(500).json({
            error: "Failed to check semester",
          });
        }

        if (checkResults.length === 0) {
          return res.status(404).json({
            error: "Semester not found",
          });
        }

        const sql = `
          INSERT INTO courses (
            semester_id,
            user_id,
            name,
            credits,
            grade,
            grade_point,
            internal_obtained,
            internal_total,
            external_obtained,
            external_total,
            practical_internal_obtained,
            practical_internal_total,
            practical_external_obtained,
            practical_external_total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          semesterId,
          userId,
          name.trim(),
          Number(credits),
          grade || "",
          Number(grade_point),
          internal_obtained ?? null,
          internal_total ?? null,
          external_obtained ?? null,
          external_total ?? null,
          practical_internal_obtained ?? null,
          practical_internal_total ?? null,
          practical_external_obtained ?? null,
          practical_external_total ?? null,
        ];

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error("Error adding course:", err);

            return res.status(500).json({
              error: "Failed to add course",
            });
          }

          res.status(201).json({
            id: result.insertId,
            message: "Course added successfully",
            user_id: userId,
          });
        });
      }
    );
  }
);

// ==========================================
// UPDATE SEMESTER
// ==========================================
router.put("/semester/:semesterId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const semesterId = req.params.semesterId;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Semester name is required",
    });
  }

  const sql = `
    UPDATE semesters
    SET name = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(
    sql,
    [name.trim(), semesterId, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating semester:", err);

        return res.status(500).json({
          error: "Failed to update semester",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Semester not found",
        });
      }

      res.json({
        message: "Semester updated successfully",
      });
    }
  );
});

// ==========================================
// DELETE SEMESTER
// ==========================================
router.delete("/semester/:semesterId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const semesterId = req.params.semesterId;

  // First verify ownership
  const checkSql = `
    SELECT id
    FROM semesters
    WHERE id = ? AND user_id = ?
  `;

  db.query(
    checkSql,
    [semesterId, userId],
    (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking semester:", checkErr);

        return res.status(500).json({
          error: "Failed to check semester",
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          error: "Semester not found",
        });
      }

      // Delete only this user's courses
      const deleteCoursesSql = `
        DELETE FROM courses
        WHERE semester_id = ? AND user_id = ?
      `;

      db.query(
        deleteCoursesSql,
        [semesterId, userId],
        (courseErr) => {
          if (courseErr) {
            console.error("Error deleting courses:", courseErr);

            return res.status(500).json({
              error: "Failed to delete courses",
            });
          }

          // Delete only this user's semester
          const deleteSemesterSql = `
            DELETE FROM semesters
            WHERE id = ? AND user_id = ?
          `;

          db.query(
            deleteSemesterSql,
            [semesterId, userId],
            (semesterErr) => {
              if (semesterErr) {
                console.error(
                  "Error deleting semester:",
                  semesterErr
                );

                return res.status(500).json({
                  error: "Failed to delete semester",
                });
              }

              res.json({
                message: "Semester deleted successfully",
              });
            }
          );
        }
      );
    }
  );
});

// ==========================================
// UPDATE COURSE
// ==========================================
router.put("/course/:courseId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.courseId;

  const {
    name,
    credits,
    grade,
    grade_point,
    internal_obtained,
    internal_total,
    external_obtained,
    external_total,
    practical_internal_obtained,
    practical_internal_total,
    practical_external_obtained,
    practical_external_total,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Course name is required",
    });
  }

  if (!credits || Number(credits) <= 0) {
    return res.status(400).json({
      error: "Credits must be greater than 0",
    });
  }

  if (
    grade_point === undefined ||
    grade_point === null ||
    grade_point === "" ||
    Number(grade_point) < 0 ||
    Number(grade_point) > 10
  ) {
    return res.status(400).json({
      error: "Grade point must be between 0 and 10",
    });
  }

  const sql = `
    UPDATE courses
    SET
      name = ?,
      credits = ?,
      grade = ?,
      grade_point = ?,
      internal_obtained = ?,
      internal_total = ?,
      external_obtained = ?,
      external_total = ?,
      practical_internal_obtained = ?,
      practical_internal_total = ?,
      practical_external_obtained = ?,
      practical_external_total = ?
    WHERE id = ? AND user_id = ?
  `;

  const values = [
    name.trim(),
    Number(credits),
    grade || "",
    Number(grade_point),
    internal_obtained ?? null,
    internal_total ?? null,
    external_obtained ?? null,
    external_total ?? null,
    practical_internal_obtained ?? null,
    practical_internal_total ?? null,
    practical_external_obtained ?? null,
    practical_external_total ?? null,
    courseId,
    userId,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating course:", err);

      return res.status(500).json({
        error: "Failed to update course",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    res.json({
      message: "Course updated successfully",
    });
  });
});

// ==========================================
// DELETE COURSE
// ==========================================
router.delete("/course/:courseId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.courseId;

  const sql = `
    DELETE FROM courses
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [courseId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting course:", err);

      return res.status(500).json({
        error: "Failed to delete course",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    res.json({
      message: "Course deleted successfully",
    });
  });
});

// ==========================================
// TEST ROUTE
// ==========================================
router.get("/test", (req, res) => {
  res.json({
    message: "CGPA routes are working",
  });
});

module.exports = router;