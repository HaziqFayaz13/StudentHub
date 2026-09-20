import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import {
  SEMESTERS,
  YEARS,
  downloadFile,
  fileKind,
  formatFileSize,
  matchesQuery,
  openFile,
  readFileAsDataUrl,
} from "../data.js";

const API_URL = "/api/previous-papers";

const MAX_FILE_SIZE = 10_000_000;

const blankForm = {
  title: "",
  subject: "",
  semester: "Semester 4",
  year: "2026",
  file: null,
};

const blankFilters = {
  subject: "All",
  year: "All",
  semester: "All",
};

function PapersPage() {
  const loading = usePageLoader(240);

  const {
    search,
    setSearch,
    pushToast,
    loggedInUserId,
  } = useApp();

  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] =
    useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] =
    useState(blankFilters);

  const [view, setView] = useState("grid");
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] =
    useState(null);
  const [form, setForm] =
    useState(blankForm);

  // =========================
  // LOAD PAPERS
  // =========================

  async function loadPapers() {
    const token =
      localStorage.getItem(
        "studenthub-token"
      );

    if (!token) {
      setPapers([]);
      setLoadingPapers(false);
      return;
    }

    try {
      setLoadingPapers(true);

      const response = await fetch(
        API_URL,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        setPapers([]);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load previous papers"
        );
      }

      setPapers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Load previous papers error:",
        error
      );

      setPapers([]);

      pushToast(
        "Could not load previous papers from server.",
        "rose"
      );
    } finally {
      setLoadingPapers(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, [loggedInUserId]);

  // =========================
  // AVAILABLE SUBJECTS
  // =========================

  const availableSubjects = useMemo(() => {
    const subjects = papers
      .map((paper) =>
        String(
          paper.subject || ""
        ).trim()
      )
      .filter(Boolean);

    return [
      ...new Set(subjects),
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [papers]);

  useEffect(() => {
    if (
      filters.subject !== "All" &&
      !availableSubjects.includes(
        filters.subject
      )
    ) {
      setFilters((current) => ({
        ...current,
        subject: "All",
      }));
    }
  }, [
    availableSubjects,
    filters.subject,
  ]);

  // =========================
  // STATS
  // =========================

  const yearsUsed = useMemo(
    () =>
      new Set(
        papers.map(
          (paper) => paper.year
        )
      ).size,
    [papers]
  );

  const subjectsUsed =
    availableSubjects.length;

  const filtersActive =
    filters.subject !== "All" ||
    filters.year !== "All" ||
    filters.semester !== "All";

  // =========================
  // FILTER PAPERS
  // =========================

  const visible = useMemo(() => {
    return papers.filter((paper) => {
      const subjectOk =
        filters.subject === "All" ||
        paper.subject ===
          filters.subject;

      const yearOk =
        filters.year === "All" ||
        String(paper.year) ===
          String(filters.year);

      const semesterOk =
        filters.semester === "All" ||
        paper.semester ===
          filters.semester;

      return (
        subjectOk &&
        yearOk &&
        semesterOk &&
        matchesQuery(
          `${paper.title} ${
            paper.subject
          } ${paper.year} ${
            paper.semester
          } ${
            paper.fileName || ""
          } ${fileKind(paper)}`,
          search
        )
      );
    });
  }, [
    papers,
    filters,
    search,
  ]);

  // =========================
  // CHECK PAPER OWNER
  // =========================

  function isPaperOwner(paper) {
    const currentUserId =
      Number(loggedInUserId);

    const paperUserId = Number(
      paper.userId ??
        paper.user_id ??
        paper.ownerId ??
        paper.owner_id
    );

    if (
      Number.isFinite(
        currentUserId
      ) &&
      Number.isFinite(paperUserId)
    ) {
      return (
        currentUserId ===
        paperUserId
      );
    }

    if (paper.isOwner === true) {
      return true;
    }

    return false;
  }

  // =========================
  // SAVE PAPER
  // =========================

  async function savePaper(event) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "studenthub-token"
      );

    if (!token) {
      pushToast(
        "Please login first.",
        "rose"
      );
      return;
    }

    if (!form.title.trim()) {
      pushToast(
        "Add a paper title.",
        "rose"
      );
      return;
    }

    if (!form.subject.trim()) {
      pushToast(
        "Enter a subject.",
        "rose"
      );
      return;
    }

    if (!form.semester) {
      pushToast(
        "Select a semester.",
        "rose"
      );
      return;
    }

    if (!form.year) {
      pushToast(
        "Select an exam year.",
        "rose"
      );
      return;
    }

    // FILE IS REQUIRED
    if (!form.file) {
      pushToast(
        "Please attach a file.",
        "rose"
      );
      return;
    }

    // FILE SIZE CHECK
    if (form.file.size > MAX_FILE_SIZE) {
      pushToast(
        "Please keep files under 10 MB.",
        "rose"
      );
      return;
    }

    try {
      setSaving(true);

      const fileMeta = {
        fileName:
          form.file.name,
        fileType:
          form.file.type,
        fileSize:
          form.file.size,
        dataUrl:
          await readFileAsDataUrl(
            form.file
          ),
      };

      const response = await fetch(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:
              form.title.trim(),
            subject:
              form.subject.trim(),
            semester:
              form.semester,
            year: form.year,
            fileName:
              fileMeta.fileName,
            fileType:
              fileMeta.fileType,
            fileSize:
              fileMeta.fileSize,
            dataUrl:
              fileMeta.dataUrl,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save previous paper"
        );
      }

      if (data.paper) {
        setPapers((current) => [
          data.paper,
          ...current,
        ]);
      } else {
        await loadPapers();
      }

      setOpen(false);
      setForm(blankForm);

      pushToast(
        "Previous paper uploaded successfully.",
        "green"
      );
    } catch (error) {
      console.error(
        "Save previous paper error:",
        error
      );

      pushToast(
        error.message ||
          "Failed to upload previous paper.",
        "rose"
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // VIEW PAPER
  // =========================

  function viewPaper(paper) {
    const dataUrl =
      paper.dataUrl ||
      paper.file_data;

    if (!dataUrl) {
      pushToast(
        "Upload a file before viewing.",
        "amber"
      );
      return;
    }

    const paperForFile = {
      ...paper,
      dataUrl,
      fileName:
        paper.fileName ||
        paper.file_name ||
        "",
      fileType:
        paper.fileType ||
        paper.file_type ||
        "",
      fileSize:
        paper.fileSize ||
        paper.file_size ||
        0,
    };

    if (!openFile(paperForFile)) {
      pushToast(
        "Allow pop-ups to view, or use Download.",
        "amber"
      );
    }
  }

  // =========================
  // DOWNLOAD PAPER
  // =========================

  function downloadPaper(paper) {
    const dataUrl =
      paper.dataUrl ||
      paper.file_data;

    if (!dataUrl) {
      pushToast(
        "Upload a file before downloading.",
        "amber"
      );
      return;
    }

    const paperForFile = {
      ...paper,
      dataUrl,
      fileName:
        paper.fileName ||
        paper.file_name ||
        "",
      fileType:
        paper.fileType ||
        paper.file_type ||
        "",
      fileSize:
        paper.fileSize ||
        paper.file_size ||
        0,
    };

    if (
      !downloadFile(
        paperForFile
      )
    ) {
      pushToast(
        "Upload a file before downloading.",
        "amber"
      );
    }
  }

  // =========================
  // DELETE PAPER
  // =========================

  async function deletePaper() {
    if (!removing) return;

    if (!isPaperOwner(removing)) {
      pushToast(
        "You can delete only your own papers.",
        "rose"
      );
      setRemoving(null);
      return;
    }

    const token =
      localStorage.getItem(
        "studenthub-token"
      );

    if (!token) {
      pushToast(
        "Please login first.",
        "rose"
      );
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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete previous paper"
        );
      }

      setPapers((current) =>
        current.filter(
          (paper) =>
            paper.id !==
            removing.id
        )
      );

      pushToast(
        `Deleted "${removing.title}".`,
        "amber"
      );

      setRemoving(null);
    } catch (error) {
      console.error(
        "Delete previous paper error:",
        error
      );

      pushToast(
        error.message ||
          "Failed to delete paper.",
        "rose"
      );
    }
  }

  if (
    loading ||
    loadingPapers
  ) {
    return (
      <Loader label="Loading previous papers" />
    );
  }

  return (
    <div className="stack">

      {/* HEADER */}

      <section className="welcome">
        <div>
          <p className="eyebrow">
            Exam prep
          </p>

          <h1>
            Previous Papers
          </h1>

          <p className="lede">
            Find question papers by
            subject, semester, and
            exam year. Upload a copy,
            then view or download it
            from StudentHub. Papers
            are shared between users,
            but only the uploader can
            delete their own paper.
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
          Upload previous paper
        </button>
      </section>

      {/* STATS */}

      <section className="stats-grid">
        <StatCard
          label="Papers in library"
          value={papers.length}
          hint="Stored in StudentHub"
          tone="indigo"
          icon="papers"
        />

        <StatCard
          label="Subjects"
          value={subjectsUsed}
          hint="Subjects with uploaded papers"
          tone="green"
          icon="book"
        />

        <StatCard
          label="Exam years"
          value={yearsUsed}
          hint="Filter by year below"
          tone="amber"
          icon="calendar"
        />

        <StatCard
          label="Showing"
          value={visible.length}
          hint={
            filtersActive ||
            search.trim()
              ? "Matching filters"
              : "All papers"
          }
          tone="indigo"
          icon="search"
        />
      </section>

      {/* TOOLBAR */}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by title, subject, semester, or year"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          aria-label="Search previous papers"
        />

        <select
          value={filters.subject}
          onChange={(event) =>
            setFilters({
              ...filters,
              subject:
                event.target.value,
            })
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

        <select
          value={filters.semester}
          onChange={(event) =>
            setFilters({
              ...filters,
              semester:
                event.target.value,
            })
          }
          aria-label="Filter by semester"
        >
          <option value="All">
            All
          </option>

          {SEMESTERS.map(
            (semester) => (
              <option
                key={semester}
                value={semester}
              >
                {semester}
              </option>
            )
          )}
        </select>

        <select
          value={filters.year}
          onChange={(event) =>
            setFilters({
              ...filters,
              year:
                event.target.value,
            })
          }
          aria-label="Filter by year"
        >
          <option value="All">
            All
          </option>

          {YEARS.map((year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            type="button"
            className="chip"
            onClick={() =>
              setFilters(
                blankFilters
              )
            }
          >
            Clear filters
          </button>
        )}

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

      {/* EMPTY STATES */}

      {papers.length === 0 ? (
        <EmptyState
          title="No previous papers yet"
          copy="Upload a question paper with subject, semester, and exam year to start the archive."
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
              Upload previous paper
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No papers match"
          copy="Try another subject, semester, or year, or clear search and filters."
        />
      ) : view === "grid" ? (

        /* GRID VIEW */

        <div className="cards-grid">
          {visible.map((paper) => {
            const owner =
              isPaperOwner(paper);

            const fileName =
              paper.fileName ||
              paper.file_name ||
              "";

            const fileType =
              paper.fileType ||
              paper.file_type ||
              "";

            const fileSize =
              paper.fileSize ||
              paper.file_size ||
              0;

            return (
              <article
                key={paper.id}
                className="file-card"
              >
                <p className="eyebrow">
                  {paper.year} ·{" "}
                  {paper.semester}
                </p>

                <h2>
                  {paper.title}
                </h2>

                <p className="muted">
                  {paper.subject}
                </p>

                <p className="muted">
                  {fileName ||
                    "No file attached"}{" "}
                  ·{" "}
                  {fileKind({
                    ...paper,
                    fileName,
                    fileType,
                  })}

                  {formatFileSize(
                    fileSize
                  )
                    ? ` · ${formatFileSize(
                        fileSize
                      )}`
                    : ""}
                </p>

                <div className="row-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      viewPaper(
                        paper
                      )
                    }
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      downloadPaper(
                        paper
                      )
                    }
                  >
                    Download
                  </button>

                  {owner ? (
                    <button
                      type="button"
                      className="text-btn danger"
                      onClick={() =>
                        setRemoving(
                          paper
                        )
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

        /* LIST VIEW */

        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>Year</th>
                  <th>File name</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visible.map(
                  (paper) => {
                    const owner =
                      isPaperOwner(
                        paper
                      );

                    const fileName =
                      paper.fileName ||
                      paper.file_name ||
                      "";

                    const fileType =
                      paper.fileType ||
                      paper.file_type ||
                      "";

                    return (
                      <tr
                        key={
                          paper.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              paper.title
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            paper.subject
                          }
                        </td>

                        <td>
                          {
                            paper.semester
                          }
                        </td>

                        <td>
                          {
                            paper.year
                          }
                        </td>

                        <td>
                          {fileName ||
                            "—"}
                        </td>

                        <td>
                          <span className="pill">
                            {fileKind(
                              {
                                ...paper,
                                fileName,
                                fileType,
                              }
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="chip"
                              onClick={() =>
                                viewPaper(
                                  paper
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="chip"
                              onClick={() =>
                                downloadPaper(
                                  paper
                                )
                              }
                            >
                              Download
                            </button>

                            {owner ? (
                              <button
                                type="button"
                                className="text-btn danger"
                                onClick={() =>
                                  setRemoving(
                                    paper
                                  )
                                }
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* UPLOAD MODAL */}

      {open && (
        <Modal
          title="Upload previous paper"
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
                form="paper-form"
                className="btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save paper"}
              </button>
            </>
          }
        >
          <form
            id="paper-form"
            className="form-grid"
            onSubmit={savePaper}
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
                placeholder="End semester 2025"
                disabled={saving}
              />
            </label>

            <label className="full">
              Subject{" "}
              <span
                style={{
                  color: "red",
                }}
              >
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

            <label>
              Semester

              <select
                value={
                  form.semester
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    semester:
                      event.target.value,
                  })
                }
                disabled={saving}
              >
                {SEMESTERS.map(
                  (semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      {semester}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Exam year

              <select
                value={form.year}
                onChange={(event) =>
                  setForm({
                    ...form,
                    year:
                      event.target.value,
                  })
                }
                disabled={saving}
              >
                {YEARS.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label>
              File{" "}
              <span
                style={{
                  color: "red",
                }}
              >
                *
              </span>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                onChange={(event) =>
                  setForm({
                    ...form,
                    file:
                      event.target
                        .files?.[0] ||
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
                PDF, Word,
                PowerPoint, text,
                or image. Maximum
                file size: 10 MB.
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* DELETE MODAL */}

      {removing && (
        <Modal
          title="Delete previous paper"
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
                onClick={deletePaper}
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
            ({removing.subject},{" "}
            {removing.year}) from
            StudentHub?
          </p>
        </Modal>
      )}
    </div>
  );
}

export default PapersPage;
