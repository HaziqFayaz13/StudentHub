const mysql = require("mysql2");

let db;

if (process.env.DATABASE_URL) {
  console.log("Using Railway DATABASE_URL");

  db = mysql.createConnection(process.env.DATABASE_URL);
} else {
  console.log("Using local MySQL");

  db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "HAZIQ@13",
    database: "StudentHub"
  });
}

db.connect((err) => {
  if (err) {
    console.log("MySQL connection failed:", err.message);
    console.log("MySQL error code:", err.code);
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;
