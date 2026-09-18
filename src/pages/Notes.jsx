import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import {
  downloadFile,
  fileKind,
  formatFileSize,
  matchesQuery,
  openFile,
  readFileAsDataUrl,
} from "../data.js";

const API_URL = "http://localhost:5000/api/notes";
const MAX_FILE_SIZE = 10_000_000;

const blankForm = {
  title: "",
  subject: "",
  description: "",
  file: null,
};

function NotesPage() {
  const loading = usePageLoader(240);

  const {
    search,
    setSearch,
    pushToast,
    loggedInUserId,
  } = useApp();

  const [notes, setNotes] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [view, setView] = useState("grid");
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadNotes() {
    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }

    try {
      setLoadingNotes(true);

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notes");
      }

      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load notes error:", error);
      setNotes([]);
      pushToast("Could not load notes from server.", "rose");
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [loggedInUserId]);

  const availableSubjects = useMemo(() => {
    const subjects = notes
      .map((note) => String(note.subject || "").trim())
      .filter(Boolean);

    return [...new Set(subjects)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [notes]);

  useEffect(() => {
    if (
      subjectFilter !== "All" &&
      !availableSubjects.includes(subjectFilter)
    ) {
      setSubjectFilter("All");
    }
  }, [availableSubjects, subjectFilter]);

  const subjectsUsed = availableSubjects.length;

  const withFiles = notes.filter(
    (note) => note.fileName || note.file_name
  ).length;

  const visible = useMemo(
    () =>
      notes.filter((note) => {
        const fileName =
          note.fileName ||
          note.file_name ||
          "";

        const matchesSubject =
          subjectFilter === "All" ||
          note.subject === subjectFilter;

        return (
          matchesSubject &&
          matchesQuery(
            `${note.title} ${note.subject} ${
              note.description || ""
            } ${fileName} ${fileKind({
              ...note,
              fileName,
            })}`,
            search
          )
        );
      }),
    [notes, subjectFilter, search]
  );

  function isNoteOwner(note) {
    const currentUserId = Number(loggedInUserId);

    const noteUserId = Number(
      note.userId ??
        note.user_id ??
        note.ownerId ??
        note.owner_id
    );

    if (
      Number.isFinite(currentUserId) &&
      Number.isFinite(noteUserId)
    ) {
      return currentUserId === noteUserId;
    }

    return note.isOwner === true;
  }

  async function saveNote(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      pushToast("Add a title for these notes.", "rose");
      return;
    }

    if (!form.subject.trim()) {
      pushToast("Enter a subject.", "rose");
      return;
    }

    // FILE IS REQUIRED
    if (!form.file) {
      pushToast("Please attach a file.", "rose");
      return;
    }

    // MAX 10 MB
    if (form.file.size > MAX_FILE_SIZE) {
      pushToast("Please keep files under 10 MB.", "rose");
      return;
    }

    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login first.", "rose");
      return;
    }

    try {
      setSaving(true);

      const fileMeta = {
        fileName: form.file.name,
        fileType: form.file.type,
        fileSize: form.file.size,
        dataUrl: await readFileAsDataUrl(form.file),
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          subject: form.subject.trim(),
          description: form.description.trim(),
          fileName: fileMeta.fileName,
          fileType: fileMeta.fileType,
          fileSize: fileMeta.fileSize,
          dataUrl: fileMeta.dataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save note"
        );
      }

      if (data.note) {
        setNotes((current) => [
          data.note,
          ...current,
        ]);
      } else {
        await loadNotes();
      }

      setOpen(false);
      setForm(blankForm);

      pushToast(
        "Notes uploaded successfully.",
        "green"
      );
    } catch (error) {
      console.error("Save note error:", error);

      pushToast(
        error.message || "Failed to upload notes.",
        "rose"
      );
    } finally {
      setSaving(false);
    }
  }

  function viewNote(note) {
    const dataUrl =
      note.dataUrl ||
      note.file_data;

    if (!dataUrl) {
      pushToast(
        "Upload a file before viewing.",
        "amber"
      );
      return;
    }

    const noteForFile = {
      ...note,
      dataUrl,
      fileName:
        note.fileName ||
        note.file_name ||
        "",
      fileType:
        note.fileType ||
        note.file_type ||
        "",
      fileSize:
        note.fileSize ||
        note.file_size ||
        0,
    };

    if (!openFile(noteForFile)) {
      pushToast(
        "Allow pop-ups to view, or use Download.",
        "amber"
      );
    }
  }

  function downloadNote(note) {
    const dataUrl =
      note.dataUrl ||
      note.file_data;

    if (!dataUrl) {
      pushToast(
        "Upload a file before downloading.",
        "amber"
      );
      return;
    }

    const noteForFile = {
      ...note,
      dataUrl,
      fileName:
        note.fileName ||
        note.file_name ||
        "",
      fileType:
        note.fileType ||
        note.file_type ||
        "",
      fileSize:
        note.fileSize ||
        note.file_size ||
        0,
    };

    if (!downloadFile(noteForFile)) {
      pushToast(
        "Upload a file before downloading.",
        "amber"
      );
    }
  }

  async function deleteNote() {
    if (!removing) return;

    if (!isNoteOwner(removing)) {
      pushToast(
        "You can delete only your own notes.",
        "rose"
      );
      setRemoving(null);
      return;
    }

    const token =
      localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login first.", "rose");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${removing.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setNotes((current) =>
        current.filter(
          (note) => note.id !== removing.id
        )
      );

      pushToast(
        `Deleted “${removing.title}”.`,
        "amber"
      );

      setRemoving(null);
    } catch (error) {
      console.error("Delete note error:", error);

      pushToast(
        error.message || "Failed to delete note.",
        "rose"
      );
    }
  }

  if (loading || loadingNotes) {
    return <Loader label="Loading notes" />;
  }

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <p className="eyebrow">
            Study files
          </p>

          <h1>Notes</h1>

          <p className="lede">
            Upload lecture notes by subject,
            then search, filter, view, or
            download them. Notes are shared
            between StudentHub users, but
            only the uploader can delete
            their own notes.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => {
            setForm(blankForm);
            setOpen(true);
          }}
        >
          Upload notes
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Uploaded notes"
          value={notes.length}
          hint="Stored in StudentHub"
          tone="indigo"
          icon="notes"
        />

        <StatCard
          label="Subjects"
          value={subjectsUsed}
          hint="Subjects with uploaded notes"
          tone="green"
          icon="book"
        />

        <StatCard
          label="Files attached"
          value={withFiles}
          hint={`${notes.length - withFiles} without a file`}
          tone="amber"
          icon="papers"
        />

        <StatCard
          label="Showing"
          value={visible.length}
          hint={
            subjectFilter === "All"
              ? "All subjects"
              : subjectFilter
          }
          tone="indigo"
          icon="search"
        />
      </section>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search notes by title, subject, or file name"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          aria-label="Search notes"
        />

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(event.target.value)
          }
          aria-label="Filter by subject"
        >
          <option value="All">
            All
          </option>

          {availableSubjects.map(
            (subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject}
              </option>
            )
          )}
        </select>

        <div className="segmented">
          <button
            type="button"
            className={
              view === "grid"
                ? "is-on"
                : ""
            }
            onClick={() =>
              setView("grid")
            }
          >
            Grid
          </button>

          <button
            type="button"
            className={
              view === "list"
                ? "is-on"
                : ""
            }
            onClick={() =>
              setView("list")
            }
          >
            List
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          copy="Upload a lecture file with a title, subject, and short description to start the shared library."
          action={
            <button
              type="button"
              className="btn"
              style={{
                marginTop: 12,
              }}
              onClick={() => {
                setForm(blankForm);
                setOpen(true);
              }}
            >
              Upload notes
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No matching notes"
          copy="Try another subject filter or clear the search."
        />
      ) : view === "grid" ? (
        <div className="cards-grid">
          {visible.map((note) => {
            const fileName =
              note.fileName ||
              note.file_name ||
              "";

            const fileType =
              note.fileType ||
              note.file_type ||
              "";

            const fileSize =
              note.fileSize ||
              note.file_size ||
              0;

            const createdAt =
              note.createdAt ||
              note.created_at ||
              "";

            const owner =
              isNoteOwner(note);

            return (
              <article
                key={note.id}
                className="file-card"
              >
                <p className="eyebrow">
                  {note.subject}
                </p>

                <h2>{note.title}</h2>

                <p className="muted">
                  {note.description ||
                    "No description"}
                </p>

                <p className="muted">
                  {fileName ||
                    "No file attached"}{" "}
                  ·{" "}
                  {fileKind({
                    ...note,
                    fileName,
                    fileType,
                  })}
                  {formatFileSize(fileSize)
                    ? ` · ${formatFileSize(
                        fileSize
                      )}`
                    : ""}
                </p>

                <p className="muted">
                  {createdAt}
                </p>

                <div className="row-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      viewNote(note)
                    }
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      downloadNote(note)
                    }
                  >
                    Download
                  </button>

                  {owner ? (
                    <button
                      type="button"
                      className="text-btn danger"
                      onClick={() =>
                        setRemoving(note)
                      }
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>File name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visible.map((note) => {
                  const fileName =
                    note.fileName ||
                    note.file_name ||
                    "";

                  const fileType =
                    note.fileType ||
                    note.file_type ||
                    "";

                  const createdAt =
                    note.createdAt ||
                    note.created_at ||
                    "";

                  const owner =
                    isNoteOwner(note);

                  return (
                    <tr key={note.id}>
                      <td>
                        <strong>
                          {note.title}
                        </strong>

                        <p className="muted">
                          {note.description ||
                            "No description"}
                        </p>
                      </td>

                      <td>
                        {note.subject}
                      </td>

                      <td>
                        {fileName || "—"}
                      </td>

                      <td>
                        <span className="pill">
                          {fileKind({
                            ...note,
                            fileName,
                            fileType,
                          })}
                        </span>
                      </td>

                      <td>
                        {createdAt}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="chip"
                            onClick={() =>
                              viewNote(note)
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="chip"
                            onClick={() =>
                              downloadNote(note)
                            }
                          >
                            Download
                          </button>

                          {owner ? (
                            <button
                              type="button"
                              className="text-btn danger"
                              onClick={() =>
                                setRemoving(note)
                              }
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {open ? (
        <Modal
          title="Upload notes"
          onClose={() => {
            if (!saving) {
              setOpen(false);
            }
          }}
          footer={
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setOpen(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="notes-form"
                className="btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save notes"}
              </button>
            </>
          }
        >
          <form
            id="notes-form"
            className="form-grid"
            onSubmit={saveNote}
          >
            <label className="full">
              Title

              <input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title:
                      event.target.value,
                  })
                }
                placeholder="Week 4 linked lists"
                disabled={saving}
              />
            </label>

            <label className="full">
              Subject{" "}
              <span style={{ color: "red" }}>
                *
              </span>

              <input
                value={form.subject}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subject:
                      event.target.value,
                  })
                }
                placeholder="Enter subject name"
                disabled={saving}
              />
            </label>

            <label className="full">
              Description

              <textarea
                rows="3"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="What these notes cover"
                disabled={saving}
              />
            </label>

            <label className="full">
              File{" "}
              <span style={{ color: "red" }}>
                *
              </span>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                onChange={(event) =>
                  setForm({
                    ...form,
                    file:
                      event.target.files?.[0] ||
                      null,
                  })
                }
                disabled={saving}
              />
            </label>

            {form.file ? (
              <p className="muted full">
                {form.file.name} ·{" "}
                {fileKind({
                  fileName:
                    form.file.name,
                  fileType:
                    form.file.type,
                })}
                {formatFileSize(
                  form.file.size
                )
                  ? ` · ${formatFileSize(
                      form.file.size
                    )}`
                  : ""}
              </p>
            ) : (
              <p className="muted full">
                PDF, Word, PowerPoint,
                text, or image.
                Maximum file size: 10 MB.
              </p>
            )}
          </form>
        </Modal>
      ) : null}

      {removing ? (
        <Modal
          title="Delete notes"
          onClose={() =>
            setRemoving(null)
          }
          footer={
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setRemoving(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn"
                onClick={deleteNote}
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            Remove{" "}
            <strong>
              {removing.title}
            </strong>{" "}
            ({removing.subject}) from
            StudentHub?
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

export default NotesPage;