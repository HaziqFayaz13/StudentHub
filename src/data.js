export const currentUser = {
  name: "Alex Rivera",
  role: "Student",
  email: "alex.rivera@northridge.edu",
  campus: "Northridge University",
  program: "B.Tech Computer Science",
  year: "Year 2 · Semester 4",
  rollNumber: "CS24-1182",
  timezone: "America/Los_Angeles",
};

export const SUBJECTS = [
  "Data Structures",
  "Calculus II",
  "Digital Electronics",
  "Operating Systems",
  "Technical English",
  "Physics Lab",
];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const GRADE_OPTIONS = ["O", "A+", "A", "B+", "B", "C", "P", "F"];

export const GRADE_POINTS = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

export const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

export const YEARS = ["2023", "2024", "2025", "2026"];

export const ATTENDANCE_THRESHOLD = 75;

export const initialAttendance = [
  {
    id: "att-1",
    subject: "Data Structures",
    attended: 28,
    total: 32,
  },
  {
    id: "att-2",
    subject: "Calculus II",
    attended: 22,
    total: 30,
  },
  {
    id: "att-3",
    subject: "Digital Electronics",
    attended: 26,
    total: 28,
  },
  {
    id: "att-4",
    subject: "Operating Systems",
    attended: 18,
    total: 26,
  },
  {
    id: "att-5",
    subject: "Technical English",
    attended: 24,
    total: 24,
  },
  {
    id: "att-6",
    subject: "Physics Lab",
    attended: 10,
    total: 12,
  },
];

export const initialSemesters = [
  {
    id: "sem-1",
    name: "Semester 1",
    courses: [
      {
        id: "c1",
        name: "Programming Fundamentals",
        credits: 4,
        grade: "A+",
      },
      {
        id: "c2",
        name: "Engineering Mathematics I",
        credits: 4,
        grade: "A",
      },
      {
        id: "c3",
        name: "Physics",
        credits: 3,
        grade: "B+",
      },
      {
        id: "c4",
        name: "English Communication",
        credits: 2,
        grade: "O",
      },
    ],
  },

  {
    id: "sem-2",
    name: "Semester 2",
    courses: [
      {
        id: "c5",
        name: "Object Oriented Programming",
        credits: 4,
        grade: "A",
      },
      {
        id: "c6",
        name: "Engineering Mathematics II",
        credits: 4,
        grade: "B+",
      },
      {
        id: "c7",
        name: "Digital Logic",
        credits: 3,
        grade: "A+",
      },
      {
        id: "c8",
        name: "Environmental Studies",
        credits: 2,
        grade: "A",
      },
    ],
  },

  {
    id: "sem-3",
    name: "Semester 3",
    courses: [
      {
        id: "c9",
        name: "Data Structures",
        credits: 4,
        grade: "A+",
      },
      {
        id: "c10",
        name: "Calculus II",
        credits: 4,
        grade: "B+",
      },
      {
        id: "c11",
        name: "Digital Electronics",
        credits: 3,
        grade: "A",
      },
      {
        id: "c12",
        name: "Technical English",
        credits: 2,
        grade: "O",
      },
    ],
  },

  {
    id: "sem-4",
    name: "Semester 4",
    courses: [
      {
        id: "c13",
        name: "Operating Systems",
        credits: 4,
        grade: "A",
      },
      {
        id: "c14",
        name: "Database Systems",
        credits: 4,
        grade: "B+",
      },
      {
        id: "c15",
        name: "Computer Networks",
        credits: 3,
        grade: "A",
      },
    ],
  },
];

export const initialTimetable = [
  {
    id: "tt-1",
    day: "Monday",
    start: "09:00",
    end: "10:00",
    subject: "Data Structures",
    room: "CS-204",
    faculty: "Dr. Meera Iyer",
  },
  {
    id: "tt-2",
    day: "Monday",
    start: "10:15",
    end: "11:15",
    subject: "Calculus II",
    room: "MH-12",
    faculty: "Prof. Alan Cho",
  },
  {
    id: "tt-3",
    day: "Monday",
    start: "11:30",
    end: "12:30",
    subject: "Operating Systems",
    room: "CS-110",
    faculty: "Dr. Priya Shah",
  },
  {
    id: "tt-4",
    day: "Tuesday",
    start: "09:00",
    end: "10:00",
    subject: "Digital Electronics",
    room: "EC-18",
    faculty: "Dr. James Okonkwo",
  },
  {
    id: "tt-5",
    day: "Tuesday",
    start: "10:15",
    end: "12:15",
    subject: "Physics Lab",
    room: "PHY-Lab 2",
    faculty: "Ms. Hannah Cole",
  },
  {
    id: "tt-6",
    day: "Tuesday",
    start: "14:00",
    end: "15:00",
    subject: "Technical English",
    room: "LH-03",
    faculty: "Prof. Sofia Alvarez",
  },
  {
    id: "tt-7",
    day: "Wednesday",
    start: "09:00",
    end: "10:00",
    subject: "Operating Systems",
    room: "CS-110",
    faculty: "Dr. Priya Shah",
  },
  {
    id: "tt-8",
    day: "Wednesday",
    start: "10:15",
    end: "11:15",
    subject: "Data Structures",
    room: "CS-204",
    faculty: "Dr. Meera Iyer",
  },
  {
    id: "tt-9",
    day: "Wednesday",
    start: "11:30",
    end: "12:30",
    subject: "Calculus II",
    room: "MH-12",
    faculty: "Prof. Alan Cho",
  },
  {
    id: "tt-10",
    day: "Thursday",
    start: "09:00",
    end: "10:00",
    subject: "Digital Electronics",
    room: "EC-18",
    faculty: "Dr. James Okonkwo",
  },
  {
    id: "tt-11",
    day: "Thursday",
    start: "10:15",
    end: "11:15",
    subject: "Technical English",
    room: "LH-03",
    faculty: "Prof. Sofia Alvarez",
  },
  {
    id: "tt-12",
    day: "Thursday",
    start: "14:00",
    end: "16:00",
    subject: "Data Structures",
    room: "CS-Lab 1",
    faculty: "Dr. Meera Iyer",
  },
  {
    id: "tt-13",
    day: "Friday",
    start: "09:00",
    end: "10:00",
    subject: "Calculus II",
    room: "MH-12",
    faculty: "Prof. Alan Cho",
  },
  {
    id: "tt-14",
    day: "Friday",
    start: "10:15",
    end: "11:15",
    subject: "Operating Systems",
    room: "CS-110",
    faculty: "Dr. Priya Shah",
  },
  {
    id: "tt-15",
    day: "Friday",
    start: "11:30",
    end: "12:30",
    subject: "Digital Electronics",
    room: "EC-18",
    faculty: "Dr. James Okonkwo",
  },
  {
    id: "tt-16",
    day: "Saturday",
    start: "09:00",
    end: "11:00",
    subject: "Physics Lab",
    room: "PHY-Lab 2",
    faculty: "Ms. Hannah Cole",
  },
  {
    id: "tt-17",
    day: "Saturday",
    start: "11:15",
    end: "12:15",
    subject: "Technical English",
    room: "LH-03",
    faculty: "Prof. Sofia Alvarez",
  },
];

const sampleNote = `data:text/plain;charset=utf-8,${encodeURIComponent(
  "StudentHub sample notes.\nRevise trees, heaps, and hashing before the next lab."
)}`;

const samplePaper = `data:text/plain;charset=utf-8,${encodeURIComponent(
  "Sample previous paper.\n1. Explain time complexity of merge sort.\n2. Differentiate process and thread."
)}`;

export const initialNotes = [
  {
    id: "note-1",
    title: "Trees and Graphs recap",
    subject: "Data Structures",
    description:
      "Short notes from week 6 lectures plus lab examples.",
    fileName: "ds-trees.txt",
    fileType: "text/plain",
    dataUrl: sampleNote,
    createdAt: "Sep 1, 2026",
  },
  {
    id: "note-2",
    title: "Integration techniques",
    subject: "Calculus II",
    description:
      "Substitution, parts, and definite integrals.",
    fileName: "calc-integration.txt",
    fileType: "text/plain",
    dataUrl: sampleNote,
    createdAt: "Aug 28, 2026",
  },
  {
    id: "note-3",
    title: "Process scheduling",
    subject: "Operating Systems",
    description:
      "FCFS, SJF, Round Robin comparison table.",
    fileName: "os-scheduling.txt",
    fileType: "text/plain",
    dataUrl: sampleNote,
    createdAt: "Sep 2, 2026",
  },
];

export const initialPapers = [
  {
    id: "paper-1",
    title: "Data Structures midterm",
    subject: "Data Structures",
    semester: "Semester 3",
    year: "2025",
    fileName: "ds-midterm-2025.txt",
    fileType: "text/plain",
    dataUrl: samplePaper,
  },
  {
    id: "paper-2",
    title: "Operating Systems end semester",
    subject: "Operating Systems",
    semester: "Semester 4",
    year: "2024",
    fileName: "os-end-2024.txt",
    fileType: "text/plain",
    dataUrl: samplePaper,
  },
  {
    id: "paper-3",
    title: "Calculus II quiz paper",
    subject: "Calculus II",
    semester: "Semester 3",
    year: "2026",
    fileName: "calc-quiz-2026.txt",
    fileType: "text/plain",
    dataUrl: samplePaper,
  },
  {
    id: "paper-4",
    title: "Digital Electronics end semester",
    subject: "Digital Electronics",
    semester: "Semester 3",
    year: "2025",
    fileName: "de-end-2025.txt",
    fileType: "text/plain",
    dataUrl: samplePaper,
  },
  {
    id: "paper-5",
    title: "Physics Lab model paper",
    subject: "Physics Lab",
    semester: "Semester 2",
    year: "2024",
    fileName: "phy-lab-2024.txt",
    fileType: "text/plain",
    dataUrl: samplePaper,
  },
];

export const initialNotifications = [
  {
    id: "n1",
    title: "Low attendance",
    body: "Operating Systems is below 75%. Plan the next few classes carefully.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n2",
    title: "Lab tomorrow",
    body: "Physics Lab is on Saturday, 9:00 AM in PHY-Lab 2.",
    time: "Yesterday",
    read: false,
  },
  {
    id: "n3",
    title: "Notes uploaded",
    body: "Process scheduling notes were added for Operating Systems.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "n4",
    title: "Previous paper",
    body: "2025 Data Structures midterm is available to review.",
    time: "3 days ago",
    read: true,
  },
];

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function matchesQuery(value, query) {
  return String(value)
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function attendancePercent(attended, total) {
  if (!total) return 0;
  return Math.round((attended / total) * 1000) / 10;
}

export function absentClasses(attended, total) {
  return Math.max(0, Number(total) - Number(attended));
}

export function classesToReachThreshold(
  attended,
  total,
  threshold = ATTENDANCE_THRESHOLD
) {
  const present = Number(attended) || 0;
  const held = Number(total) || 0;

  if (attendancePercent(present, held) >= threshold) {
    return 0;
  }

  if (threshold >= 100) {
    return held === 0 ? 1 : 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (threshold * held - 100 * present) /
        (100 - threshold)
    )
  );
}

export function subjectAttendance(record) {
  const attended = Number(record.attended) || 0;
  const total = Number(record.total) || 0;
  const absent = absentClasses(attended, total);
  const percent = attendancePercent(attended, total);
  const low = percent < ATTENDANCE_THRESHOLD;

  return {
    attended,
    total,
    absent,
    percent,
    low,
    needed: classesToReachThreshold(attended, total),
  };
}

export function overallAttendance(records) {
  const totals = records.reduce(
    (acc, item) => ({
      attended:
        acc.attended + Number(item.attended),
      total:
        acc.total + Number(item.total),
    }),
    {
      attended: 0,
      total: 0,
    }
  );

  return {
    ...totals,
    absent: absentClasses(
      totals.attended,
      totals.total
    ),
    percent: attendancePercent(
      totals.attended,
      totals.total
    ),
  };
}

export function coursePoints(course) {
  const credits = Number(course.credits) || 0;
  const gp = GRADE_POINTS[course.grade] ?? 0;

  return credits * gp;
}

export function gradePoint(grade) {
  return GRADE_POINTS[grade] ?? 0;
}

export function totalCredits(courses) {
  return courses.reduce(
    (sum, course) =>
      sum + (Number(course.credits) || 0),
    0
  );
}

export function totalCreditPoints(courses) {
  return courses.reduce(
    (sum, course) =>
      sum + coursePoints(course),
    0
  );
}

export function calcSGPA(courses) {
  const credits = totalCredits(courses);

  if (!credits) return 0;

  return (
    Math.round(
      (totalCreditPoints(courses) / credits) * 100
    ) / 100
  );
}

export function calcCGPA(semesters) {
  const courses = semesters.flatMap(
    (semester) => semester.courses
  );

  return calcSGPA(courses);
}

export function cgpaStanding(score) {
  if (score >= 9) {
    return {
      label: "Outstanding",
      pill: "status-active",
    };
  }

  if (score >= 8) {
    return {
      label: "Excellent",
      pill: "status-in-progress",
    };
  }

  if (score >= 7) {
    return {
      label: "First class",
      pill: "status-in-progress",
    };
  }

  if (score >= 6) {
    return {
      label: "Second class",
      pill: "status-pending",
    };
  }

  if (score > 0) {
    return {
      label: "Needs improvement",
      pill: "status-failed",
    };
  }

  return {
    label: "No records yet",
    pill: "",
  };
}

export function semesterPerformance(semesters) {
  let runningCredits = 0;
  let runningPoints = 0;

  return semesters.map((semester) => {
    const credits = totalCredits(
      semester.courses
    );

    const points = totalCreditPoints(
      semester.courses
    );

    const sgpa = calcSGPA(
      semester.courses
    );

    runningCredits += credits;
    runningPoints += points;

    return {
      id: semester.id,
      name: semester.name,
      courseCount: semester.courses.length,
      credits,
      points,
      sgpa,
      cumulativeCgpa: runningCredits
        ? Math.round(
            (runningPoints / runningCredits) * 100
          ) / 100
        : 0,
    };
  });
}

export function parseMinutes(time) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

export function compareSlots(a, b) {
  const dayDelta =
    DAYS.indexOf(a.day) -
    DAYS.indexOf(b.day);

  if (dayDelta) return dayDelta;

  return (
    parseMinutes(a.start) -
    parseMinutes(b.start)
  );
}

export function formatTime(time) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 =
    ((hours + 11) % 12) + 1;

  return `${hour12}:${String(minutes).padStart(
    2,
    "0"
  )} ${suffix}`;
}

export function isClassPeriod(slot) {
  return (slot.type || "class") === "class";
}

/*
 * IMPORTANT:
 * Break and lunch are now stored directly in MySQL.
 *
 * Previously this function automatically created
 * fake break/lunch entries on the frontend.
 *
 * That made Edit/Delete fail because those entries
 * did not actually exist in MySQL.
 *
 * Now we ONLY normalize and sort the MySQL data.
 */
export function withBreakPeriods(slots) {
  const normalized = slots.map((slot) => ({
    ...slot,
    type: slot.type || "class",
  }));

  return normalized.sort(compareSlots);
}

export function getTimetableHighlights(
  slots,
  date = new Date()
) {
  const jsDay = date.getDay();
  const minutes =
    date.getHours() * 60 +
    date.getMinutes();

  let currentId = null;
  let upcomingId = null;

  if (jsDay >= 1 && jsDay <= 6) {
    const dayName = DAYS[jsDay - 1];

    const todaySlots = slots
      .filter(
        (slot) => slot.day === dayName
      )
      .sort(
        (a, b) =>
          parseMinutes(a.start) -
          parseMinutes(b.start)
      );

    for (const slot of todaySlots) {
      const start = parseMinutes(
        slot.start
      );

      const end = parseMinutes(
        slot.end
      );

      if (
        minutes >= start &&
        minutes < end
      ) {
        currentId = slot.id;
      }
    }

    for (const slot of todaySlots) {
      if (!isClassPeriod(slot)) continue;

      if (
        parseMinutes(slot.start) >
        minutes
      ) {
        upcomingId = slot.id;
        break;
      }
    }
  }

  if (!upcomingId) {
    for (
      let offset = 1;
      offset <= 7;
      offset += 1
    ) {
      const nextJsDay =
        (jsDay + offset) % 7;

      if (nextJsDay === 0) continue;

      const dayName =
        DAYS[nextJsDay - 1];

      const first = slots
        .filter(
          (slot) =>
            slot.day === dayName &&
            isClassPeriod(slot)
        )
        .sort(
          (a, b) =>
            parseMinutes(a.start) -
            parseMinutes(b.start)
        )[0];

      if (first) {
        upcomingId = first.id;
        break;
      }
    }
  }

  return {
    currentId,
    upcomingId,
  };
}

export function todayName(
  date = new Date()
) {
  const jsDay = date.getDay();

  return jsDay >= 1 && jsDay <= 6
    ? DAYS[jsDay - 1]
    : null;
}

export function readFileAsDataUrl(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = () =>
        reject(
          new Error(
            "Could not read that file."
          )
        );

      reader.readAsDataURL(file);
    }
  );
}

export function openFile(item) {
  if (!item?.dataUrl) return false;

  const tab = window.open();

  if (!tab) return false;

  const title = String(
    item.fileName || "File"
  ).replace(
    /[<>&"']/g,
    ""
  );

  tab.document.write(
    `<title>${title}</title><iframe src="${item.dataUrl}" style="border:0;width:100%;height:100%"></iframe>`
  );

  return true;
}

export function downloadFile(item) {
  if (!item?.dataUrl) return false;

  const link =
    document.createElement("a");

  link.href = item.dataUrl;
  link.download =
    item.fileName || "download";

  document.body.appendChild(link);
  link.click();
  link.remove();

  return true;
}

export function fileKind(item) {
  const name =
    item?.fileName || "";

  const mime =
    item?.fileType || "";

  const ext = name.includes(".")
    ? name
        .split(".")
        .pop()
        .toUpperCase()
    : "";

  if (ext) return ext;

  if (mime.includes("pdf")) {
    return "PDF";
  }

  if (
    mime.includes("word") ||
    mime.includes("msword")
  ) {
    return "DOC";
  }

  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint")
  ) {
    return "PPT";
  }

  if (mime.startsWith("image/")) {
    return "IMAGE";
  }

  if (mime.startsWith("text/")) {
    return "TXT";
  }

  if (mime) {
    return mime
      .split("/")
      .pop()
      .toUpperCase();
  }

  return "No file";
}

export function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}