import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import {
  ATTENDANCE_THRESHOLD,
  attendancePercent,
  compareSlots,
  formatTime,
  getTimetableHighlights,
  initials,
  matchesQuery,
  overallAttendance,
  todayName,
} from "../data.js";

function DashboardPage() {
  const loading = usePageLoader();
  const navigate = useNavigate();

  const {
    profile,
    attendance,
    semesters,
    timetable,
    notes,
    papers,
    search,
  } = useApp();

  const now = new Date();
  const today = todayName(now);

  const { currentId, upcomingId } =
    getTimetableHighlights(timetable, now);

  const totals = useMemo(() => {
    return overallAttendance(attendance);
  }, [attendance]);

  // Calculate CGPA directly from the semesters data.
  // CGPA = total (credits × grade point) / total graded credits
  const cgpa = useMemo(() => {
    let totalQualityPoints = 0;
    let totalCredits = 0;

    semesters.forEach((semester) => {
      const courses = semester.courses || [];

      courses.forEach((course) => {
        const credits = Number(course.credits);
        const gradePoint = Number(course.grade_point);

        if (
          Number.isFinite(credits) &&
          credits > 0 &&
          Number.isFinite(gradePoint) &&
          gradePoint >= 0
        ) {
          totalQualityPoints +=
            credits * gradePoint;

          totalCredits += credits;
        }
      });
    });

    if (totalCredits === 0) {
      return 0;
    }

    return (
      totalQualityPoints / totalCredits
    );
  }, [semesters]);

  const lowSubjects = useMemo(() => {
    return attendance.filter((item) => {
      const percent = attendancePercent(
        item.attended,
        item.total
      );

      return (
        percent < ATTENDANCE_THRESHOLD
      );
    });
  }, [attendance]);

  const todaysClasses = useMemo(() => {
    const list = timetable
      .filter((slot) => slot.day === today)
      .sort((a, b) =>
        a.start.localeCompare(b.start)
      );

    return list.filter((slot) =>
      matchesQuery(
        `${slot.subject} ${slot.faculty} ${slot.room}`,
        search
      )
    );
  }, [timetable, today, search]);

  const upcomingClasses = useMemo(() => {
    const ordered = [...timetable].sort(
      compareSlots
    );

    const startIndex = Math.max(
      0,
      ordered.findIndex(
        (slot) =>
          slot.id === upcomingId ||
          slot.id === currentId
      )
    );

    return ordered.slice(
      startIndex,
      startIndex + 4
    );
  }, [
    timetable,
    upcomingId,
    currentId,
  ]);

  if (loading) {
    return (
      <Loader label="Loading dashboard" />
    );
  }

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <p className="eyebrow">
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <h1>
            Welcome back,{" "}
            {profile.name.split(" ")[0]}
          </h1>

          <p className="lede">
            {profile.program} · {profile.year}.
            Track attendance, CGPA, classes,
            notes, and previous papers in one
            place.
          </p>
        </div>

        <div className="profile-chip">
          <span className="avatar">
            {initials(profile.name)}
          </span>

          <div>
            <strong>{profile.name}</strong>
            <p className="muted">
              {profile.rollNumber}
            </p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Overall attendance"
          value={`${totals.percent}%`}
          hint={`${totals.attended}/${totals.total} classes`}
          tone={
            totals.percent <
            ATTENDANCE_THRESHOLD
              ? "rose"
              : "green"
          }
          icon="attendance"
        />

        <StatCard
          label="Current CGPA"
          value={cgpa.toFixed(2)}
          hint={
            semesters.length > 0
              ? `${semesters.length} semesters recorded`
              : "No CGPA data yet"
          }
          tone="indigo"
          icon="cap"
        />

        <StatCard
          label="Today's classes"
          value={
            today
              ? timetable.filter(
                  (slot) =>
                    slot.day === today
                ).length
              : 0
          }
          hint={
            today ||
            "No classes on Sunday"
          }
          tone="amber"
          icon="calendar"
        />

        <StatCard
          label="Low attendance"
          value={lowSubjects.length}
          hint={`Below ${ATTENDANCE_THRESHOLD}%`}
          tone="rose"
          icon="alert"
        />
      </section>

      <section className="quick-grid">
        <button
          type="button"
          className="quick-card"
          onClick={() =>
            navigate("/notes")
          }
        >
          <span className="stat-icon">
            <Icon name="notes" />
          </span>

          <div>
            <strong>Notes</strong>
            <p>
              {notes.length} uploaded files
            </p>
          </div>
        </button>

        <button
          type="button"
          className="quick-card"
          onClick={() =>
            navigate("/papers")
          }
        >
          <span className="stat-icon">
            <Icon name="papers" />
          </span>

          <div>
            <strong>
              Previous papers
            </strong>
            <p>
              {papers.length} question papers
            </p>
          </div>
        </button>

        <button
          type="button"
          className="quick-card"
          onClick={() =>
            navigate("/attendance")
          }
        >
          <span className="stat-icon">
            <Icon name="attendance" />
          </span>

          <div>
            <strong>
              Update attendance
            </strong>
            <p>
              Mark present or absent
            </p>
          </div>
        </button>

        <button
          type="button"
          className="quick-card"
          onClick={() =>
            navigate("/cgpa")
          }
        >
          <span className="stat-icon">
            <Icon name="cap" />
          </span>

          <div>
            <strong>
              CGPA calculator
            </strong>
            <p>
              Add subjects and grades
            </p>
          </div>
        </button>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Today's classes</h2>
              <p className="muted">
                {today
                  ? today
                  : "Sunday — no scheduled classes"}
              </p>
            </div>

            <button
              type="button"
              className="text-btn"
              onClick={() =>
                navigate("/timetable")
              }
            >
              Full timetable
            </button>
          </div>

          {todaysClasses.length === 0 ? (
            <p className="muted">
              {!today
                ? "No scheduled classes on Sunday."
                : search.trim()
                  ? "No classes match the current search."
                  : "No classes listed for today."}
            </p>
          ) : (
            <ul className="class-list">
              {todaysClasses.map(
                (slot) => (
                  <li
                    key={slot.id}
                    className={`class-row ${
                      slot.id === currentId
                        ? "is-now"
                        : ""
                    } ${
                      slot.id === upcomingId
                        ? "is-next"
                        : ""
                    }`}
                  >
                    <div>
                      <strong>
                        {slot.subject}
                      </strong>

                      <p>
                        {slot.faculty} ·{" "}
                        {slot.room}
                      </p>
                    </div>

                    <span>
                      {formatTime(
                        slot.start
                      )}{" "}
                      –{" "}
                      {formatTime(
                        slot.end
                      )}

                      {slot.id ===
                      currentId
                        ? " · Now"
                        : slot.id ===
                            upcomingId
                          ? " · Next"
                          : ""}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                Upcoming classes
              </h2>

              <p className="muted">
                Next sessions on your
                timetable
              </p>
            </div>
          </div>

          {upcomingClasses.length ===
          0 ? (
            <p className="muted">
              No upcoming classes on the
              timetable.
            </p>
          ) : (
            <ul className="class-list">
              {upcomingClasses.map(
                (slot) => (
                  <li
                    key={slot.id}
                    className={`class-row ${
                      slot.id === currentId
                        ? "is-now"
                        : ""
                    } ${
                      slot.id === upcomingId
                        ? "is-next"
                        : ""
                    }`}
                  >
                    <div>
                      <strong>
                        {slot.subject}
                      </strong>

                      <p>
                        {slot.day} ·{" "}
                        {slot.room}
                      </p>
                    </div>

                    <span>
                      {formatTime(
                        slot.start
                      )}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              Academic overview
            </h2>

            <p className="muted">
              Subject attendance this
              semester
            </p>
          </div>
        </div>

        <div className="overview-grid">
          {attendance.map((item) => {
            const percent =
              attendancePercent(
                item.attended,
                item.total
              );

            return (
              <div
                key={item.id}
                className="overview-row"
              >
                <div className="progress-copy">
                  <strong>
                    {item.subject}
                  </strong>

                  <span>
                    {percent}% ·{" "}
                    {item.attended}/
                    {item.total}
                  </span>
                </div>

                <div
                  className="progress-track"
                  aria-hidden="true"
                >
                  <div
                    className={`progress-fill ${
                      percent <
                      ATTENDANCE_THRESHOLD
                        ? "is-low"
                        : ""
                    }`}
                    style={{
                      width: `${Math.min(
                        percent,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;