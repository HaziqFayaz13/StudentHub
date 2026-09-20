const mysql = require("mysql2");

let db;

if (process.env.DATABASE_URL) {
  console.log("Using Railway DATABASE_URL");

  db = mysql.createConnection(process.env.DATABASE_URL);
} else {
  console.log("Using local MySQL");

  db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "StudentHub",
  });
}

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;
