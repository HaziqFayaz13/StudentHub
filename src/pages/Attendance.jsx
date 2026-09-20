import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import {
  ATTENDANCE_THRESHOLD,
  SUBJECTS,
  matchesQuery,
  overallAttendance,
  subjectAttendance,
} from "../data.js";

const API_URL = "/api/attendance";

const blank = {
  subject: SUBJECTS[0] || "",
  attended: 0,
  total: 0,
};

function AttendancePage() {
  const loading = usePageLoader(280);

  const {
    attendance,
    setAttendance,
    search,
    pushToast,
  } = useApp();

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const token = localStorage.getItem("studenthub-token");

  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch attendance");
        }

        const data = await response.json();

        setAttendance(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Attendance load error:", error);
        pushToast("Failed to load attendance from MySQL.", "rose");
      }
    }

    if (token) {
      loadAttendance();
    }
  }, [token, setAttendance, pushToast]);

  const totals = overallAttendance(attendance);

  const lowSubjects = useMemo(
    () =>
      attendance.filter(
        (item) => subjectAttendance(item).low
      ),
    [attendance]
  );

  const rows = useMemo(
    () =>
      attendance.filter((item) =>
        matchesQuery(item.subject, search)
      ),
    [attendance, search]
  );

  async function saveRecord(event) {
    event.preventDefault();

    const attended = Number(form.attended);
    const total = Number(form.total);
    const subject = String(form.subject || "").trim();

    if (!subject) {
      pushToast("Enter a subject name.", "rose");
      return;
    }

    if (
      total < 0 ||
      attended < 0 ||
      attended > total
    ) {
      pushToast(
        "Attended classes cannot be more than total classes.",
        "rose"
      );
      return;
    }

    const duplicate = attendance.some(
      (item) =>
        item.subject.toLowerCase() === subject.toLowerCase() &&
        item.id !== editing?.id
    );

    if (duplicate) {
      pushToast(
        "That subject is already in your attendance list.",
        "amber"
      );
      return;
    }

    try {
      if (editing?.id) {
        const response = await fetch(
          `${API_URL}/${editing.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              subject,
              attended,
              total,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update attendance");
        }

        setAttendance((current) =>
          current.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  subject,
                  attended,
                  total,
                }
              : item
          )
        );

        pushToast("Attendance updated.", "green");
      } else {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            attended,
            total,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add attendance");
        }

        const newRecord = await response.json();

        setAttendance((current) => [
          ...current,
          newRecord,
        ]);

        pushToast(
          "Attendance record added.",
          "green"
        );
      }

      setEditing(null);
      setForm(blank);
    } catch (error) {
      console.error("Attendance save error:", error);
      pushToast(
        "Failed to save attendance to MySQL.",
        "rose"
      );
    }
  }

  async function mark(item, present) {
    const updatedAttended =
      item.attended + (present ? 1 : 0);

    const updatedTotal = item.total + 1;

    try {
      const response = await fetch(
        `${API_URL}/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: item.subject,
            attended: updatedAttended,
            total: updatedTotal,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update attendance");
      }

      setAttendance((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                total: updatedTotal,
                attended: updatedAttended,
              }
            : row
        )
      );

      pushToast(
        present
          ? `Marked present for ${item.subject}.`
          : `Marked absent for ${item.subject}.`,
        present ? "green" : "amber"
      );
    } catch (error) {
      console.error("Attendance mark error:", error);
      pushToast(
        "Failed to update attendance in MySQL.",
        "rose"
      );
    }
  }

  if (loading) {
    return <Loader label="Loading attendance" />;
  }

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <p className="eyebrow">Records</p>

          <h1>Attendance</h1>

          <p className="lede">
            Track present, absent, and total classes for each
            subject. Anything below {ATTENDANCE_THRESHOLD}% is
            flagged as low attendance.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => {
            setForm(blank);
            setEditing({});
          }}
        >
          Add subject
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Overall attendance"
          value={`${totals.percent}%`}
          hint={`${totals.attended} present of ${totals.total} classes`}
          tone={
            totals.percent < ATTENDANCE_THRESHOLD
              ? "rose"
              : "green"
          }
          icon="attendance"
        />

        <StatCard
          label="Classes present"
          value={totals.attended}
          hint="Marked attended"
          tone="indigo"
          icon="book"
        />

        <StatCard
          label="Classes absent"
          value={totals.absent}
          hint="Missed this semester"
          tone="amber"
          icon="alert"
        />

        <StatCard
          label="Low attendance"
          value={lowSubjects.length}
          hint={`Below ${ATTENDANCE_THRESHOLD}%`}
          tone="rose"
          icon="alert"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Overall progress</h2>

            <p className="muted">
              Combined present / absent / total across every
              subject
            </p>
          </div>

          <span
            className={`pill ${
              totals.percent < ATTENDANCE_THRESHOLD
                ? "status-failed"
                : "status-active"
            }`}
          >
            {totals.percent < ATTENDANCE_THRESHOLD
              ? "Below requirement"
              : "On track"}
          </span>
        </div>

        <div className="sgpa-bar">
          <span>Overall</span>

          <div
            className="progress-track"
            aria-hidden="true"
          >
            <div
              className={`progress-fill ${
                totals.percent < ATTENDANCE_THRESHOLD
                  ? "is-low"
                  : ""
              }`}
              style={{
                width: `${Math.min(
                  totals.percent,
                  100
                )}%`,
              }}
            />
          </div>

          <strong>{totals.percent}%</strong>
        </div>

        <p
          className="muted"
          style={{ marginTop: 12 }}
        >
          {totals.attended} present · {totals.absent} absent ·{" "}
          {totals.total} total · requirement{" "}
          {ATTENDANCE_THRESHOLD}%
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Low attendance</h2>

            <p className="muted">
              Subjects under the {ATTENDANCE_THRESHOLD}%
              college requirement
            </p>
          </div>
        </div>

        {lowSubjects.length === 0 ? (
          <p className="muted">
            Every subject is at or above{" "}
            {ATTENDANCE_THRESHOLD}%.
          </p>
        ) : (
          <ul className="class-list">
            {lowSubjects.map((item) => {
              const stats = subjectAttendance(item);

              return (
                <li
                  key={item.id}
                  className="class-row"
                >
                  <div>
                    <strong>{item.subject}</strong>

                    <p>
                      {stats.attended} present ·{" "}
                      {stats.absent} absent ·{" "}
                      {stats.total} total
                      {stats.needed
                        ? ` · attend the next ${
                            stats.needed
                          } class${
                            stats.needed === 1
                              ? ""
                              : "es"
                          } to reach ${
                            ATTENDANCE_THRESHOLD
                          }%`
                        : ""}
                    </p>

                    <div
                      className="progress-track"
                      style={{
                        marginTop: 10,
                        maxWidth: 280,
                      }}
                      aria-hidden="true"
                    >
                      <div
                        className="progress-fill is-low"
                        style={{
                          width: `${Math.min(
                            stats.percent,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <span className="pill status-failed">
                    {stats.percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Subject-wise attendance</h2>

            <p className="muted">
              Present, absent, and total classes with progress
              for each subject
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No subjects found"
            copy="Add a subject or clear the search in the top bar."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => {
                  const stats = subjectAttendance(item);

                  return (
                    <tr
                      key={item.id}
                      className={
                        stats.low ? "row-low" : ""
                      }
                    >
                      <td>{item.subject}</td>

                      <td>{stats.attended}</td>

                      <td>{stats.absent}</td>

                      <td>{stats.total}</td>

                      <td>
                        <div className="mini-meter">
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${
                                stats.low
                                  ? "is-low"
                                  : ""
                              }`}
                              style={{
                                width: `${Math.min(
                                  stats.percent,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <strong>
                            {stats.percent}%
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`pill ${
                            stats.low
                              ? "status-failed"
                              : "status-active"
                          }`}
                        >
                          {stats.low ? "Low" : "Safe"}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="chip present"
                            onClick={() =>
                              mark(item, true)
                            }
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            className="chip absent"
                            onClick={() =>
                              mark(item, false)
                            }
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            className="text-btn"
                            onClick={() => {
                              setForm({
                                subject: item.subject,
                                attended: item.attended,
                                total: item.total,
                              });

                              setEditing(item);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <Modal
          title={
            editing.id
              ? "Update attendance"
              : "Add attendance record"
          }
          onClose={() => setEditing(null)}
          footer={
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="attendance-form"
                className="btn"
              >
                Save
              </button>
            </>
          }
        >
          <form
            id="attendance-form"
            className="form-grid"
            onSubmit={saveRecord}
          >
            <label className="full">
              Subject

              <input
                list="attendance-subjects"
                value={form.subject}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subject: event.target.value,
                  })
                }
                placeholder="Operating Systems"
              />

              <datalist id="attendance-subjects">
                {SUBJECTS.map((subject) => (
                  <option
                    key={subject}
                    value={subject}
                  />
                ))}
              </datalist>
            </label>

            <label>
              Classes present

              <input
                type="number"
                min="0"
                value={form.attended}
                onChange={(event) =>
                  setForm({
                    ...form,
                    attended: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Total classes

              <input
                type="number"
                min="0"
                value={form.total}
                onChange={(event) =>
                  setForm({
                    ...form,
                    total: event.target.value,
                  })
                }
              />
            </label>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export default AttendancePage;
