import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import {
  DAYS,
  formatTime,
  getTimetableHighlights,
  isClassPeriod,
  matchesQuery,
  todayName,
  withBreakPeriods,
} from "../data.js";

const API_URL = "/api/timetable";

function slotLabel(slot) {
  if (slot.type === "lunch") return "Lunch";
  if (slot.type === "break") return "Break";
  return "Class";
}

const emptyForm = {
  day: "Monday",
  start: "09:00",
  end: "10:00",
  subject: "",
  room: "",
  faculty: "",
  type: "class",
};

function TimetablePage() {
  const loading = usePageLoader(220);

  const {
    timetable,
    setTimetable,
    timetableLoading,
    search,
    pushToast,
  } = useApp();

  const now = new Date();
  const today = todayName(now);

  const [focusDay, setFocusDay] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const schedule = useMemo(
    () => withBreakPeriods(timetable),
    [timetable]
  );

  const { currentId, upcomingId } = getTimetableHighlights(
    schedule,
    now
  );

  const currentSlot = schedule.find(
    (slot) => slot.id === currentId
  );

  const upcomingSlot = schedule.find(
    (slot) => slot.id === upcomingId
  );

  const filtered = useMemo(() => {
    const query = search.trim();

    return schedule.filter((slot) => {
      const dayOk =
        focusDay === "All" || slot.day === focusDay;

      if (!dayOk) return false;

      if (!query) return true;

      return matchesQuery(
        `${slot.subject} ${slot.room} ${slot.faculty} ${slot.day} ${slot.type}`,
        query
      );
    });
  }, [schedule, search, focusDay]);

  const visibleDays =
    focusDay === "All" ? DAYS : [focusDay];

  const classCount = timetable.filter(isClassPeriod).length;

  const todaysClasses = schedule.filter(
    (slot) =>
      slot.day === today &&
      isClassPeriod(slot)
  );

  function openAddForm(day = "Monday") {
    setEditingId(null);

    setForm({
      ...emptyForm,
      day,
      type: "class",
    });

    setShowForm(true);
  }

  function openEditForm(slot) {
    setEditingId(slot.id);

    setForm({
      day: slot.day,
      start: slot.start,
      end: slot.end,
      subject: slot.subject || "",
      room: slot.room || "",
      faculty: slot.faculty || "",
      type: slot.type || "class",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.subject.trim()) {
      pushToast("Subject / title is required", "amber");
      return;
    }

    if (!form.start || !form.end) {
      pushToast("Start and end time are required", "amber");
      return;
    }

    if (form.start >= form.end) {
      pushToast("End time must be after start time", "amber");
      return;
    }

    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login again", "red");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        day: form.day,
        start: form.start,
        end: form.end,
        subject: form.subject.trim(),
        room: form.room.trim(),
        faculty: form.faculty.trim(),
        type: form.type,
      };

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error ||
          errorData.message ||
          "Failed to save timetable"
        );
      }

      const saved = await response.json();

      const normalized = {
        ...saved,
        id: String(saved.id),
        start: String(saved.start).slice(0, 5),
        end: String(saved.end).slice(0, 5),
        type: saved.type || "class",
      };

      if (editingId) {
        setTimetable((current) =>
          current.map((slot) =>
            String(slot.id) === String(editingId)
              ? normalized
              : slot
          )
        );

        pushToast(
          "Timetable updated successfully",
          "green"
        );
      } else {
        setTimetable((current) => [
          ...current,
          normalized,
        ]);

        pushToast(
          "Class added successfully",
          "green"
        );
      }

      closeForm();
    } catch (error) {
      console.error("Timetable save error:", error);

      pushToast(
        error.message || "Could not save timetable",
        "red"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slot) {
    const confirmed = window.confirm(
      `Delete "${slot.subject}" from ${slot.day} ${formatTime(
        slot.start
      )} – ${formatTime(slot.end)}?`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login again", "red");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${slot.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error ||
          errorData.message ||
          "Failed to delete timetable"
        );
      }

      setTimetable((current) =>
        current.filter(
          (item) =>
            String(item.id) !== String(slot.id)
        )
      );

      pushToast(
        "Timetable entry deleted",
        "green"
      );
    } catch (error) {
      console.error("Timetable delete error:", error);

      pushToast(
        error.message ||
        "Could not delete timetable",
        "red"
      );
    }
  }

  if (loading || timetableLoading) {
    return <Loader label="Loading timetable" />;
  }

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <p className="eyebrow">
            Weekly schedule
          </p>

          <h1>Class Time Table</h1>

          <p className="lede">
            Monday to Saturday with subject, room, faculty,
            short break, and lunch. You can add, edit, or
            delete any timetable entry.
          </p>
        </div>

        <div className="legend-inline">
          <span className="pill status-in-progress">
            Now
          </span>

          <span className="pill status-pending">
            Upcoming
          </span>

          <span className="pill">
            Break / Lunch
          </span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Today's classes"
          value={today ? todaysClasses.length : 0}
          hint={
            today ||
            "Sunday — no scheduled classes"
          }
          tone="amber"
          icon="calendar"
        />

        <StatCard
          label="Current period"
          value={
            currentSlot
              ? currentSlot.subject
              : "Free"
          }
          hint={
            currentSlot
              ? `${formatTime(
                  currentSlot.start
                )} – ${formatTime(currentSlot.end)}`
              : "No period running now"
          }
          tone="indigo"
          icon="spark"
        />

        <StatCard
          label="Upcoming class"
          value={
            upcomingSlot
              ? upcomingSlot.subject
              : "None"
          }
          hint={
            upcomingSlot
              ? `${upcomingSlot.day} · ${formatTime(
                  upcomingSlot.start
                )} · ${upcomingSlot.room || "TBC"}`
              : "No further class this week"
          }
          tone="green"
          icon="cap"
        />

        <StatCard
          label="Weekly classes"
          value={classCount}
          hint="Lecture and lab slots"
          tone="indigo"
          icon="book"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              {today
                ? `${today}'s schedule`
                : "Sunday"}
            </h2>

            <p className="muted">
              {today
                ? "Class periods, break, and lunch for today"
                : "No classes are scheduled on Sunday."}
            </p>
          </div>

          {today && (
            <button
              type="button"
              className="button primary"
              onClick={() => openAddForm(today)}
            >
              + Add class
            </button>
          )}
        </div>

        {!today ? (
          <p className="muted">
            No classes on Sunday. Use the week view to
            plan Monday to Saturday.
          </p>
        ) : (
          <ul className="class-list">
            {schedule
              .filter(
                (slot) => slot.day === today
              )
              .map((slot) => (
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
                      {isClassPeriod(slot)
                        ? `${slot.faculty || "Faculty TBC"} · ${
                            slot.room || "TBC"
                          }`
                        : slot.room ||
                          slotLabel(slot)}
                    </p>
                  </div>

                  <span>
                    {formatTime(slot.start)} –{" "}
                    {formatTime(slot.end)}

                    {slot.id === currentId
                      ? " · Now"
                      : slot.id === upcomingId
                      ? " · Next"
                      : ` · ${slotLabel(slot)}`}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <div className="toolbar">
        {["All", ...DAYS].map((day) => (
          <button
            key={day}
            type="button"
            className={`chip ${
              focusDay === day ? "is-on" : ""
            }`}
            onClick={() => setFocusDay(day)}
          >
            {day === "All"
              ? "Full week"
              : day}

            {day === today
              ? " · Today"
              : ""}
          </button>
        ))}

        <button
          type="button"
          className="button primary"
          onClick={() =>
            openAddForm(
              focusDay === "All"
                ? today || "Monday"
                : focusDay
            )
          }
        >
          + Add timetable entry
        </button>
      </div>

      {showForm && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                {editingId
                  ? "Edit timetable entry"
                  : "Add timetable entry"}
              </h2>

              <p className="muted">
                Changes are saved directly to MySQL.
              </p>
            </div>

            <button
              type="button"
              className="button"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          <form
            className="form-grid"
            onSubmit={handleSave}
          >
            <label>
              <span>Day</span>

              <select
                name="day"
                value={form.day}
                onChange={handleChange}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="class">
                  Class
                </option>

                <option value="break">
                  Short break
                </option>

                <option value="lunch">
                  Lunch
                </option>
              </select>
            </label>

            <label>
              <span>Start time</span>

              <input
                type="time"
                name="start"
                value={form.start}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>End time</span>

              <input
                type="time"
                name="end"
                value={form.end}
                onChange={handleChange}
              />
            </label>

            <label className="form-span-2">
              <span>
                {form.type === "class"
                  ? "Subject"
                  : "Title"}
              </span>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder={
                  form.type === "class"
                    ? "e.g. Data Structures"
                    : "e.g. Short break"
                }
              />
            </label>

            <label>
              <span>Room / Location</span>

              <input
                type="text"
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="e.g. CS-204"
              />
            </label>

            <label>
              <span>Faculty</span>

              <input
                type="text"
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                placeholder="e.g. Dr. Meera Iyer"
              />
            </label>

            <div className="form-actions form-span-2">
              <button
                type="button"
                className="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Add entry"}
              </button>
            </div>
          </form>
        </section>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No periods found"
          copy="Try another day filter or clear the search in the top bar."
        />
      ) : (
        <div
          className={`timetable ${
            focusDay !== "All"
              ? "is-single"
              : ""
          }`}
        >
          {visibleDays.map((day) => {
            const slots = filtered.filter(
              (slot) => slot.day === day
            );

            const classSlots =
              slots.filter(isClassPeriod);

            return (
              <section
                key={day}
                className={`panel day-col ${
                  day === today
                    ? "is-today"
                    : ""
                }`}
              >
                <div className="panel-header">
                  <div>
                    <h2>{day}</h2>

                    <p className="muted">
                      {classSlots.length} class
                      {classSlots.length === 1
                        ? ""
                        : "es"}

                      {day === today
                        ? " · Today"
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      openAddForm(day)
                    }
                  >
                    + Add
                  </button>
                </div>

                {slots.length === 0 ? (
                  <p className="muted">
                    No periods on this day.
                  </p>
                ) : (
                  <ul className="slot-list">
                    {slots.map((slot) => (
                      <li
                        key={slot.id}
                        className={`slot ${
                          slot.type === "lunch" ||
                          slot.type === "break"
                            ? `is-${slot.type}`
                            : ""
                        } ${
                          slot.id === currentId
                            ? "is-now"
                            : ""
                        } ${
                          slot.id === upcomingId
                            ? "is-next"
                            : ""
                        }`}
                      >
                        <p className="eyebrow">
                          {formatTime(
                            slot.start
                          )}{" "}
                          –{" "}
                          {formatTime(
                            slot.end
                          )}
                        </p>

                        <strong>
                          {slot.subject}
                        </strong>

                        {isClassPeriod(slot) ? (
                          <>
                            <p>
                              Room{" "}
                              {slot.room ||
                                "TBC"}
                            </p>

                            <p>
                              {slot.faculty ||
                                "Faculty TBC"}
                            </p>
                          </>
                        ) : (
                          <p>
                            {slot.room ||
                              slotLabel(slot)}
                          </p>
                        )}

                        <div className="slot-actions">
                          {slot.id ===
                            currentId && (
                            <span className="pill status-in-progress">
                              Now
                            </span>
                          )}

                          {slot.id ===
                            upcomingId && (
                            <span className="pill status-pending">
                              Upcoming
                            </span>
                          )}

                          {slot.type === "lunch" ||
                          slot.type === "break" ? (
                            <span className="pill">
                              {slotLabel(slot)}
                            </span>
                          ) : null}

                          <button
                            type="button"
                            className="button small"
                            onClick={() =>
                              openEditForm(
                                slot
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button small danger"
                            onClick={() =>
                              handleDelete(
                                slot
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TimetablePage;
