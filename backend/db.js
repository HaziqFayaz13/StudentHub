const mysql = require("mysql2");

let db;

const isRailway = Boolean(process.env.MYSQLHOST);

console.log("========== DATABASE CHECK ==========");
console.log("MYSQLHOST:", Boolean(process.env.MYSQLHOST));
console.log("MYSQLPORT:", Boolean(process.env.MYSQLPORT));
console.log("MYSQLUSER:", Boolean(process.env.MYSQLUSER));
console.log("MYSQLPASSWORD:", Boolean(process.env.MYSQLPASSWORD));
console.log("MYSQLDATABASE:", Boolean(process.env.MYSQLDATABASE));
console.log("MYSQL_URL:", Boolean(process.env.MYSQL_URL));
console.log("DATABASE_URL:", Boolean(process.env.DATABASE_URL));
console.log("====================================");

if (isRailway) {
  db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
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
    console.log("========== MYSQL ERROR ==========");
    console.log("message:", err.message);
    console.log("code:", err.code);
    console.log("errno:", err.errno);
    console.log("sqlState:", err.sqlState);
    console.log("=================================");
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;
