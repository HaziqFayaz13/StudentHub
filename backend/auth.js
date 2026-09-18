const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

const db = require("./db");

const router = express.Router();

// ======================================================
// LOAD ENV
// ======================================================

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();

console.log("=================================");
console.log("AUTH SYSTEM STARTING");
console.log("JWT_SECRET loaded:", Boolean(JWT_SECRET));
console.log("JWT_SECRET length:", JWT_SECRET.length);
console.log("=================================");

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization token missing",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Token missing",
    });
  }

  if (!JWT_SECRET) {
    console.error("JWT VERIFY ERROR: JWT_SECRET missing");

    return res.status(500).json({
      message: "JWT secret is not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Normal login tokens only
    if (decoded.type === "password-reset") {
      return res.status(401).json({
        message: "Password reset token cannot be used for login",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT VERIFY ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      securityAnswer,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !securityAnswer
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and security answer are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const cleanSecurityAnswer = String(
      securityAnswer
    )
      .trim()
      .toLowerCase();

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    if (!cleanSecurityAnswer) {
      return res.status(400).json({
        message: "Security answer is required",
      });
    }

    db.query(
      "SELECT COUNT(*) AS accountCount FROM users WHERE email = ?",
      [cleanEmail],
      async (selectError, results) => {
        if (selectError) {
          console.error(
            "REGISTER SELECT ERROR:",
            selectError
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        const accountCount = Number(
          results && results[0]
            ? results[0].accountCount
            : 0
        );

        if (accountCount >= 3) {
          return res.status(409).json({
            message:
              "Maximum 3 accounts allowed for this email",
          });
        }

        try {
          // Hash password
          const hashedPassword = await bcrypt.hash(
            password,
            10
          );

          // Hash security answer
          const hashedSecurityAnswer =
            await bcrypt.hash(
              cleanSecurityAnswer,
              10
            );

          db.query(
            `INSERT INTO users
            (
              name,
              email,
              password_hash,
              security_answer_hash
            )
            VALUES (?, ?, ?, ?)`,
            [
              cleanName,
              cleanEmail,
              hashedPassword,
              hashedSecurityAnswer,
            ],
            (insertError, result) => {
              if (insertError) {
                console.error(
                  "REGISTER INSERT ERROR:",
                  insertError
                );

                if (
                  insertError.sqlState === "45000" ||
                  String(
                    insertError.message
                  ).includes(
                    "Maximum 3 accounts allowed"
                  )
                ) {
                  return res.status(409).json({
                    message:
                      "Maximum 3 accounts allowed for this email",
                  });
                }

                return res.status(500).json({
                  message: "Failed to create account",
                });
              }

              const userId = Number(
                result.insertId
              );

              if (!JWT_SECRET) {
                console.error(
                  "REGISTER JWT ERROR: JWT_SECRET missing"
                );

                return res.status(500).json({
                  message:
                    "JWT secret is not configured",
                });
              }

              let token;

              try {
                token = jwt.sign(
                  {
                    id: userId,
                    email: cleanEmail,
                  },
                  JWT_SECRET,
                  {
                    expiresIn: "7d",
                  }
                );

                console.log(
                  "REGISTER: JWT CREATED"
                );
              } catch (jwtError) {
                console.error(
                  "REGISTER JWT ERROR:",
                  jwtError
                );

                return res.status(500).json({
                  message:
                    "Account created but token creation failed",
                });
              }

              return res.status(201).json({
                message: "Registration successful",

                token,

                user: {
                  id: userId,
                  name: cleanName,
                  email: cleanEmail,
                  rollNumber: "",
                  college: "",
                  program: "",
                  yearSemester: "",
                },
              });
            }
          );
        } catch (hashError) {
          console.error(
            "PASSWORD/SECURITY ANSWER HASH ERROR:",
            hashError
          );

          return res.status(500).json({
            message:
              "Password or security answer hashing failed",
          });
        }
      }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

// ======================================================
// LOGIN
// ======================================================

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const cleanEmail = String(email)
    .trim()
    .toLowerCase();

  db.query(
    `SELECT
      id,
      name,
      email,
      password_hash,
      roll_number,
      college,
      program,
      year_semester
    FROM users
    WHERE email = ?
    ORDER BY id ASC`,
    [cleanEmail],
    async (error, results) => {
      if (error) {
        console.error(
          "LOGIN DATABASE ERROR:",
          error
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (!results || results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      let matchedUser = null;

      try {
        for (const user of results) {
          if (!user.password_hash) {
            continue;
          }

          const passwordCorrect =
            await bcrypt.compare(
              password,
              user.password_hash
            );

          if (passwordCorrect) {
            matchedUser = user;
            break;
          }
        }
      } catch (passwordError) {
        console.error(
          "PASSWORD VERIFICATION ERROR:",
          passwordError
        );

        return res.status(500).json({
          message:
            "Password verification failed",
        });
      }

      if (!matchedUser) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (!JWT_SECRET) {
        console.error(
          "LOGIN JWT ERROR: JWT_SECRET missing"
        );

        return res.status(500).json({
          message: "JWT secret is not configured",
        });
      }

      console.log(
        "LOGIN: PASSWORD VERIFIED FOR USER:",
        matchedUser.id
      );

      let token;

      try {
        token = jwt.sign(
          {
            id: Number(matchedUser.id),
            email: String(matchedUser.email),
          },
          JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

        console.log(
          "LOGIN: JWT CREATED SUCCESSFULLY"
        );
      } catch (jwtError) {
        console.error(
          "LOGIN JWT SIGN ERROR:",
          jwtError
        );

        return res.status(500).json({
          message: "JWT sign error",
          error: jwtError.message,
        });
      }

      return res.status(200).json({
        message: "Login successful",

        token,

        user: {
          id: Number(matchedUser.id),
          name: matchedUser.name || "",
          email: matchedUser.email || "",
          rollNumber:
            matchedUser.roll_number || "",
          college:
            matchedUser.college || "",
          program:
            matchedUser.program || "",
          yearSemester:
            matchedUser.year_semester || "",
        },
      });
    }
  );
});

// ======================================================
// FORGOT PASSWORD - VERIFY SECURITY ANSWER
// ======================================================

router.post(
  "/forgot-password/verify",
  async (req, res) => {
    try {
      const {
        email,
        securityAnswer,
      } = req.body;

      if (!email || !securityAnswer) {
        return res.status(400).json({
          message:
            "Email and security answer are required",
        });
      }

      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      const cleanAnswer = String(
        securityAnswer
      )
        .trim()
        .toLowerCase();

      if (!cleanEmail || !cleanAnswer) {
        return res.status(400).json({
          message:
            "Email and security answer are required",
        });
      }

      if (!JWT_SECRET) {
        console.error(
          "FORGOT PASSWORD JWT ERROR: JWT_SECRET missing"
        );

        return res.status(500).json({
          message:
            "JWT secret is not configured",
        });
      }

      db.query(
        `SELECT
          id,
          email,
          security_answer_hash
        FROM users
        WHERE email = ?
        ORDER BY id ASC`,
        [cleanEmail],
        async (error, users) => {
          if (error) {
            console.error(
              "FORGOT PASSWORD DATABASE ERROR:",
              error
            );

            return res.status(500).json({
              message: "Database error",
            });
          }

          if (!users || users.length === 0) {
            return res.status(401).json({
              message:
                "Incorrect answer. Try again.",
            });
          }

          const matchedUsers = [];

          try {
            for (const user of users) {
              if (!user.security_answer_hash) {
                continue;
              }

              const answerCorrect =
                await bcrypt.compare(
                  cleanAnswer,
                  user.security_answer_hash
                );

              if (answerCorrect) {
                matchedUsers.push(user);
              }
            }
          } catch (compareError) {
            console.error(
              "SECURITY ANSWER VERIFICATION ERROR:",
              compareError
            );

            return res.status(500).json({
              message:
                "Security answer verification failed",
            });
          }

          if (matchedUsers.length === 0) {
            return res.status(401).json({
              message:
                "Incorrect answer. Try again.",
            });
          }

          // Same email + same answer on multiple
          // accounts would be ambiguous.
          if (matchedUsers.length > 1) {
            return res.status(409).json({
              message:
                "Multiple accounts match this answer. Please use the correct answer.",
            });
          }

          const matchedUser =
            matchedUsers[0];

          try {
            const resetToken = jwt.sign(
              {
                id: Number(matchedUser.id),
                email: String(
                  matchedUser.email
                ),
                type: "password-reset",
              },
              JWT_SECRET,
              {
                expiresIn: "10m",
              }
            );

            console.log(
              "FORGOT PASSWORD: SECURITY ANSWER VERIFIED FOR USER:",
              matchedUser.id
            );

            return res.status(200).json({
              message:
                "Security answer verified",
              resetToken,
            });
          } catch (jwtError) {
            console.error(
              "RESET TOKEN ERROR:",
              jwtError
            );

            return res.status(500).json({
              message:
                "Failed to create reset token",
            });
          }
        }
      );
    } catch (error) {
      console.error(
        "FORGOT PASSWORD VERIFY ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Forgot password verification failed",
      });
    }
  }
);

// ======================================================
// FORGOT PASSWORD - RESET PASSWORD
// ======================================================

router.post(
  "/forgot-password/reset",
  async (req, res) => {
    try {
      const {
        resetToken,
        newPassword,
      } = req.body;

      if (!resetToken || !newPassword) {
        return res.status(400).json({
          message:
            "Reset token and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message:
            "New password must be at least 6 characters",
        });
      }

      if (!JWT_SECRET) {
        console.error(
          "PASSWORD RESET JWT ERROR: JWT_SECRET missing"
        );

        return res.status(500).json({
          message:
            "JWT secret is not configured",
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(
          resetToken,
          JWT_SECRET
        );
      } catch (verifyError) {
        console.error(
          "RESET TOKEN VERIFY ERROR:",
          verifyError.message
        );

        return res.status(401).json({
          message:
            "Reset link expired or invalid. Try again.",
        });
      }

      if (
        decoded.type !== "password-reset" ||
        !decoded.id
      ) {
        return res.status(401).json({
          message: "Invalid password reset token",
        });
      }

      db.query(
        `SELECT id
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [decoded.id],
        async (error, results) => {
          if (error) {
            console.error(
              "PASSWORD RESET DATABASE ERROR:",
              error
            );

            return res.status(500).json({
              message: "Database error",
            });
          }

          if (
            !results ||
            results.length === 0
          ) {
            return res.status(404).json({
              message: "User not found",
            });
          }

          try {
            const newHash =
              await bcrypt.hash(
                newPassword,
                10
              );

            db.query(
              `UPDATE users
               SET password_hash = ?
               WHERE id = ?`,
              [
                newHash,
                decoded.id,
              ],
              (updateError) => {
                if (updateError) {
                  console.error(
                    "PASSWORD RESET UPDATE ERROR:",
                    updateError
                  );

                  return res.status(500).json({
                    message:
                      "Failed to reset password",
                  });
                }

                console.log(
                  "PASSWORD RESET SUCCESSFUL FOR USER:",
                  decoded.id
                );

                return res.status(200).json({
                  message:
                    "Password reset successfully",
                });
              }
            );
          } catch (hashError) {
            console.error(
              "PASSWORD RESET HASH ERROR:",
              hashError
            );

            return res.status(500).json({
              message:
                "Password reset failed",
            });
          }
        }
      );
    } catch (error) {
      console.error(
        "PASSWORD RESET ERROR:",
        error
      );

      return res.status(500).json({
        message: "Password reset failed",
      });
    }
  }
);

// ======================================================
// GET PROFILE
// ======================================================

router.get(
  "/profile",
  authenticateToken,
  (req, res) => {
    db.query(
      `SELECT
        id,
        name,
        email,
        roll_number,
        college,
        program,
        year_semester
      FROM users
      WHERE id = ?
      LIMIT 1`,
      [req.user.id],
      (error, results) => {
        if (error) {
          console.error(
            "PROFILE GET ERROR:",
            error
          );

          return res.status(500).json({
            message: "Failed to load profile",
          });
        }

        if (
          !results ||
          results.length === 0
        ) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        const user = results[0];

        return res.json({
          id: Number(user.id),
          name: user.name || "",
          email: user.email || "",
          rollNumber:
            user.roll_number || "",
          college:
            user.college || "",
          program:
            user.program || "",
          yearSemester:
            user.year_semester || "",
        });
      }
    );
  }
);

// ======================================================
// UPDATE PROFILE
// ======================================================

router.put(
  "/profile",
  authenticateToken,
  (req, res) => {
    const {
      name,
      email,
      rollNumber,
      college,
      program,
      yearSemester,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

    db.query(
      `SELECT id
       FROM users
       WHERE email = ?
       AND id != ?
       LIMIT 1`,
      [cleanEmail, req.user.id],
      (checkError) => {
        if (checkError) {
          console.error(
            "PROFILE EMAIL CHECK ERROR:",
            checkError
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        db.query(
          `SELECT COUNT(*) AS accountCount
           FROM users
           WHERE email = ?
           AND id != ?`,
          [cleanEmail, req.user.id],
          (countError, countResults) => {
            if (countError) {
              console.error(
                "PROFILE EMAIL COUNT ERROR:",
                countError
              );

              return res.status(500).json({
                message: "Database error",
              });
            }

            const accountCount = Number(
              countResults &&
              countResults[0]
                ? countResults[0].accountCount
                : 0
            );

            if (accountCount >= 3) {
              return res.status(409).json({
                message:
                  "Maximum 3 accounts allowed for this email",
              });
            }

            db.query(
              `UPDATE users
               SET
                 name = ?,
                 email = ?,
                 roll_number = ?,
                 college = ?,
                 program = ?,
                 year_semester = ?
               WHERE id = ?`,
              [
                cleanName,
                cleanEmail,
                rollNumber || "",
                college || "",
                program || "",
                yearSemester || "",
                req.user.id,
              ],
              (updateError) => {
                if (updateError) {
                  console.error(
                    "PROFILE UPDATE ERROR:",
                    updateError
                  );

                  if (
                    updateError.sqlState ===
                      "45000" ||
                    String(
                      updateError.message
                    ).includes(
                      "Maximum 3 accounts allowed"
                    )
                  ) {
                    return res.status(409).json({
                      message:
                        "Maximum 3 accounts allowed for this email",
                    });
                  }

                  return res.status(500).json({
                    message:
                      "Failed to update profile",
                  });
                }

                return res.json({
                  message:
                    "Profile updated successfully",

                  user: {
                    id: Number(req.user.id),
                    name: cleanName,
                    email: cleanEmail,
                    rollNumber:
                      rollNumber || "",
                    college:
                      college || "",
                    program:
                      program || "",
                    yearSemester:
                      yearSemester || "",
                  },
                });
              }
            );
          }
        );
      }
    );
  }
);

// ======================================================
// CHANGE PASSWORD
// ======================================================

router.put(
  "/password",
  authenticateToken,
  async (req, res) => {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
    }

    db.query(
      `SELECT password_hash
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id],
      async (error, results) => {
        if (error) {
          console.error(
            "PASSWORD DATABASE ERROR:",
            error
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        if (
          !results ||
          results.length === 0
        ) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        try {
          const correct =
            await bcrypt.compare(
              currentPassword,
              results[0].password_hash
            );

          if (!correct) {
            return res.status(401).json({
              message:
                "Current password is incorrect",
            });
          }

          const newHash =
            await bcrypt.hash(
              newPassword,
              10
            );

          db.query(
            `UPDATE users
             SET password_hash = ?
             WHERE id = ?`,
            [
              newHash,
              req.user.id,
            ],
            (updateError) => {
              if (updateError) {
                console.error(
                  "PASSWORD UPDATE ERROR:",
                  updateError
                );

                return res.status(500).json({
                  message:
                    "Failed to change password",
                });
              }

              return res.json({
                message:
                  "Password changed successfully",
              });
            }
          );
        } catch (passwordError) {
          console.error(
            "PASSWORD CHANGE ERROR:",
            passwordError
          );

          return res.status(500).json({
            message:
              "Password change failed",
          });
        }
      }
    );
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;

module.exports.authenticateToken =
  authenticateToken;