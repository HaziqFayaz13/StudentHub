import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  currentUser,
  initialAttendance,
  initialNotifications,
} from "../data.js";

const AppContext = createContext(null);

const API_BASE = "/api";

const DEFAULT_PREFS = {
  attendanceAlerts: true,
  classReminders: true,
  weeklyDigest: true,
  compactTables: false,
};

function getSavedUser() {
  const savedUser = localStorage.getItem("studenthub-user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("studenthub-token");
}

function profileFromUser(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    rollNumber: user?.rollNumber || user?.roll_number || "",
    campus: user?.college || "",
    program: user?.program || "",
    year: user?.yearSemester || user?.year_semester || "",
  };
}

function convertCgpaData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  const semesterMap = {};

  data.forEach((item) => {
    if (
      item.semester_id === null ||
      item.semester_id === undefined
    ) {
      return;
    }

    const semesterId = String(item.semester_id);

    if (!semesterMap[semesterId]) {
      semesterMap[semesterId] = {
        id: item.semester_id,
        name: item.semester_name || "",
        courses: [],
      };
    }

    if (
      item.course_id !== null &&
      item.course_id !== undefined
    ) {
      semesterMap[semesterId].courses.push({
        id: item.course_id,
        name: item.course_name || "",
        credits:
          item.credits !== null &&
          item.credits !== undefined
            ? Number(item.credits)
            : "",

        grade: item.grade || "",

        grade_point:
          item.grade_point !== null &&
          item.grade_point !== undefined &&
          item.grade_point !== ""
            ? Number(item.grade_point)
            : "",

        internal_obtained:
          item.internal_obtained ?? null,

        internal_total:
          item.internal_total ?? null,

        external_obtained:
          item.external_obtained ?? null,

        external_total:
          item.external_total ?? null,

        practical_internal_obtained:
          item.practical_internal_obtained ?? null,

        practical_internal_total:
          item.practical_internal_total ?? null,

        practical_external_obtained:
          item.practical_external_obtained ?? null,

        practical_external_total:
          item.practical_external_total ?? null,
      });
    }
  });

  return Object.values(semesterMap);
}

export function AppProvider({ children }) {
  const [loggedInUserId, setLoggedInUserId] = useState(() => {
    const user = getSavedUser();
    return user?.id || null;
  });

  const [profile, setProfile] = useState(() => {
    const user = getSavedUser();

    if (user) {
      return profileFromUser(user);
    }

    return currentUser;
  });

  const [dataLoading, setDataLoading] = useState(true);

  const [attendance, setAttendance] = useState(
    initialAttendance || []
  );

  const [semesters, setSemesters] = useState([]);

  /*
   * This version prevents an old CGPA GET request
   * from overwriting a newer Add/Edit/Delete operation.
   */
  const cgpaMutationVersion = useRef(0);

  const [timetable, setTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);

  const [notes, setNotes] = useState([]);
  const [papers, setPapers] = useState([]);

  const [notifications, setNotifications] = useState(
    initialNotifications || []
  );

  const [search, setSearch] = useState("");

  const [toasts, setToasts] = useState([]);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const pushToast = useCallback(
    (message, tone = "indigo") => {
      const id =
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          tone,
        },
      ]);

      window.setTimeout(() => {
        setToasts((current) =>
          current.filter((toast) => toast.id !== id)
        );
      }, 2800);
    },
    []
  );

  /*
   * CGPA STATE UPDATE
   *
   * Every Add/Edit/Delete operation in Cgpa.jsx
   * will use this function.
   *
   * Incrementing the version invalidates any older
   * CGPA GET request which is still running.
   */
  const updateSemesters = useCallback((updater) => {
    cgpaMutationVersion.current += 1;

    setSemesters((current) => {
      if (typeof updater === "function") {
        return updater(current);
      }

      return updater;
    });
  }, []);

  useEffect(() => {
    function checkLoggedInUser() {
      const user = getSavedUser();
      const newUserId = user?.id || null;

      setLoggedInUserId((oldUserId) => {
        if (String(oldUserId) !== String(newUserId)) {
          return newUserId;
        }

        return oldUserId;
      });
    }

    checkLoggedInUser();

    const interval = window.setInterval(
      checkLoggedInUser,
      300
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAllUserData() {
      const token = getToken();
      const user = getSavedUser();

      if (!token || !user?.id) {
        if (cancelled) {
          return;
        }

        setProfile(currentUser);
        setAttendance([]);
        setSemesters([]);
        setTimetable([]);
        setNotes([]);
        setPapers([]);
        setNotifications(initialNotifications || []);
        setPrefs(DEFAULT_PREFS);
        setDataLoading(false);
        setTimetableLoading(false);

        return;
      }

      const userId = user.id;

      setDataLoading(true);
      setTimetableLoading(true);

      setAttendance([]);
      setSemesters([]);
      setTimetable([]);
      setNotes([]);
      setPapers([]);

      /*
       * New user loading starts with a fresh CGPA version.
       */
      cgpaMutationVersion.current += 1;

      setProfile(profileFromUser(user));

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      /*
       * Capture the version of CGPA state when this request starts.
       */
      const cgpaRequestVersion =
        cgpaMutationVersion.current;

      try {
        const [
          profileResponse,
          attendanceResponse,
          cgpaResponse,
          timetableResponse,
          notesResponse,
          papersResponse,
          settingsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/auth/profile`, {
            headers,
          }),

          fetch(`${API_BASE}/attendance`, {
            headers,
          }),

          fetch(`${API_BASE}/cgpa`, {
            headers,
          }),

          fetch(`${API_BASE}/timetable`, {
            headers,
          }),

          fetch(`${API_BASE}/notes`, {
            headers,
          }),

          fetch(`${API_BASE}/previous-papers`, {
            headers,
          }),

          fetch(`${API_BASE}/settings`, {
            headers,
          }),
        ]);

        if (cancelled) {
          return;
        }

        const latestUser = getSavedUser();
        const latestUserId = latestUser?.id || null;

        if (
          String(latestUserId) !== String(userId)
        ) {
          return;
        }

        const responses = [
          profileResponse,
          attendanceResponse,
          cgpaResponse,
          timetableResponse,
          notesResponse,
          papersResponse,
          settingsResponse,
        ];

        const hasUnauthorized = responses.some(
          (response) => response.status === 401
        );

        if (hasUnauthorized) {
          localStorage.removeItem("studenthub-token");
          localStorage.removeItem("studenthub-user");
          localStorage.removeItem("studenthub-profile");

          setLoggedInUserId(null);

          setProfile(currentUser);
          setAttendance([]);
          setSemesters([]);
          setTimetable([]);
          setNotes([]);
          setPapers([]);
          setPrefs(DEFAULT_PREFS);

          setDataLoading(false);
          setTimetableLoading(false);

          return;
        }

        if (profileResponse.ok) {
          try {
            const data =
              await profileResponse.json();

            if (
              !cancelled &&
              String(data.id) === String(userId)
            ) {
              const updatedProfile = {
                name: data.name || "",
                email: data.email || "",

                rollNumber:
                  data.rollNumber ||
                  data.roll_number ||
                  "",

                campus:
                  data.college || "",

                program:
                  data.program || "",

                year:
                  data.yearSemester ||
                  data.year_semester ||
                  "",
              };

              setProfile(updatedProfile);

              localStorage.setItem(
                "studenthub-profile",
                JSON.stringify(updatedProfile)
              );

              localStorage.setItem(
                "studenthub-user",
                JSON.stringify({
                  ...user,
                  ...data,
                })
              );
            }
          } catch (error) {
            console.error(
              "Profile JSON error:",
              error
            );
          }
        }

        if (attendanceResponse.ok) {
          try {
            const data =
              await attendanceResponse.json();

            if (!cancelled) {
              setAttendance(
                Array.isArray(data)
                  ? data
                  : []
              );
            }
          } catch (error) {
            console.error(
              "Attendance JSON error:",
              error
            );

            if (!cancelled) {
              setAttendance([]);
            }
          }
        } else {
          setAttendance([]);
        }

        /*
         * CGPA
         *
         * IMPORTANT:
         * Only apply this response if no newer CGPA
         * mutation happened while this request was running.
         */
        if (cgpaResponse.ok) {
          try {
            const data =
              await cgpaResponse.json();

            if (
              !cancelled &&
              cgpaRequestVersion ===
                cgpaMutationVersion.current
            ) {
              const convertedCgpa =
                convertCgpaData(data);

              setSemesters(convertedCgpa);
            }
          } catch (error) {
            console.error(
              "CGPA JSON error:",
              error
            );

            if (
              !cancelled &&
              cgpaRequestVersion ===
                cgpaMutationVersion.current
            ) {
              setSemesters([]);
            }
          }
        } else if (
          cgpaRequestVersion ===
          cgpaMutationVersion.current
        ) {
          setSemesters([]);
        }

        if (timetableResponse.ok) {
          try {
            const data =
              await timetableResponse.json();

            if (!cancelled) {
              if (Array.isArray(data)) {
                setTimetable(
                  data.map((slot) => ({
                    ...slot,

                    id: String(slot.id),

                    start: String(
                      slot.start || ""
                    ).slice(0, 5),

                    end: String(
                      slot.end || ""
                    ).slice(0, 5),

                    type:
                      slot.type || "class",
                  }))
                );
              } else {
                setTimetable([]);
              }
            }
          } catch (error) {
            console.error(
              "Timetable JSON error:",
              error
            );

            if (!cancelled) {
              setTimetable([]);
            }
          }
        } else {
          setTimetable([]);
        }

        if (notesResponse.ok) {
          try {
            const data =
              await notesResponse.json();

            if (!cancelled) {
              setNotes(
                Array.isArray(data)
                  ? data
                  : []
              );
            }
          } catch (error) {
            console.error(
              "Notes JSON error:",
              error
            );

            if (!cancelled) {
              setNotes([]);
            }
          }
        } else {
          setNotes([]);
        }

        if (papersResponse.ok) {
          try {
            const data =
              await papersResponse.json();

            if (!cancelled) {
              setPapers(
                Array.isArray(data)
                  ? data
                  : []
              );
            }
          } catch (error) {
            console.error(
              "Papers JSON error:",
              error
            );

            if (!cancelled) {
              setPapers([]);
            }
          }
        } else {
          setPapers([]);
        }

        if (settingsResponse.ok) {
          try {
            const data =
              await settingsResponse.json();

            if (!cancelled) {
              setPrefs({
                attendanceAlerts:
                  Boolean(
                    data.attendanceAlerts ??
                      data.attendance_alerts ??
                      true
                  ),

                classReminders:
                  Boolean(
                    data.classReminders ??
                      data.class_reminders ??
                      true
                  ),

                weeklyDigest:
                  Boolean(
                    data.weeklyDigest ??
                      data.weekly_digest ??
                      true
                  ),

                compactTables:
                  Boolean(
                    data.compactTables ??
                      data.compact_tables ??
                      false
                  ),
              });
            }
          } catch (error) {
            console.error(
              "Settings JSON error:",
              error
            );

            if (!cancelled) {
              setPrefs(DEFAULT_PREFS);
            }
          }
        } else {
          setPrefs(DEFAULT_PREFS);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error loading StudentHub data:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
          setTimetableLoading(false);
        }
      }
    }

    loadAllUserData();

    return () => {
      cancelled = true;
    };
  }, [loggedInUserId]);

  const value = useMemo(
    () => ({
      profile,
      setProfile,

      loggedInUserId,

      dataLoading,

      attendance,
      setAttendance,

      semesters,
      setSemesters,

      /*
       * Use this for CGPA mutations.
       */
      updateSemesters,

      timetable,
      setTimetable,
      timetableLoading,

      notes,
      setNotes,

      papers,
      setPapers,

      notifications,
      setNotifications,

      search,
      setSearch,

      toasts,

      dismissToast: (id) =>
        setToasts((current) =>
          current.filter(
            (toast) => toast.id !== id
          )
        ),

      pushToast,

      prefs,
      setPrefs,

      unreadCount: notifications.filter(
        (item) => !item.read
      ).length,
    }),
    [
      profile,
      loggedInUserId,
      dataLoading,
      attendance,
      semesters,
      updateSemesters,
      timetable,
      timetableLoading,
      notes,
      papers,
      notifications,
      search,
      toasts,
      pushToast,
      prefs,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used within AppProvider"
    );
  }

  return context;
}
