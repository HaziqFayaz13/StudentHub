const mysql = require("mysql2");

let db;

if (process.env.DB_HOST) {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
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
    console.log("MySQL error code:", err.code);
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;
