const mysql = require("mysql2");

let db;

if (process.env.DATABASE_URL) {
  db = mysql.createConnection(process.env.DATABASE_URL);
} else {
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
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;
