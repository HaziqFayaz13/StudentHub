const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the backend folder
dotenv.config({
  path: path.join(__dirname, ".env"),
});

console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Routes
const attendanceRoutes = require("./routes/attendance");
const cgpaRoutes = require("./routes/cgpa");
const timetableRoutes = require("./timetable");
const authRoutes = require("./auth");
const notesRoutes = require("./routes/notes");
const previousPapersRoutes = require("./routes/previousPapers");
const settingsRoutes = require("./routes/settings");

// API routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/cgpa", cgpaRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/previous-papers", previousPapersRoutes);
app.use("/api/settings", settingsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("StudentHub Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});