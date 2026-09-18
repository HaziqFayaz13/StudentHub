import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePageLoader } from "../hooks/usePageLoader.js";
import { SEMESTERS, SUBJECTS } from "../data.js";

const API_URL = "http://localhost:5000/api/cgpa";

function getAuthHeaders() {
  const token = localStorage.getItem("studenthub-token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function courseMarks(course) {
  const components = [
    {
      obtained: course.internal_obtained,
      total: course.internal_total,
    },
    {
      obtained: course.external_obtained,
      total: course.external_total,
    },
    {
      obtained: course.practical_internal_obtained,
      total: course.practical_internal_total,
    },
    {
      obtained: course.practical_external_obtained,
      total: course.practical_external_total,
    },
  ];

  return components.reduce(
    (result, component) => {
      if (
        component.obtained !== null &&
        component.obtained !== undefined &&
        component.total !== null &&
        component.total !== undefined &&
        Number(component.total) > 0
      ) {
        result.obtained += Number(component.obtained);
        result.total += Number(component.total);
      }

      return result;
    },
    {
      obtained: 0,
      total: 0,
    }
  );
}

function coursePercentage(course) {
  const marks = courseMarks(course);

  if (marks.total <= 0) {
    return 0;
  }

  return (marks.obtained / marks.total) * 100;
}

function semesterMarks(courses = []) {
  return courses.reduce(
    (result, course) => {
      const marks = courseMarks(course);

      result.obtained += marks.obtained;
      result.total += marks.total;

      return result;
    },
    {
      obtained: 0,
      total: 0,
    }
  );
}

function courseGradePoint(course) {
  const value = Number(course.grade_point);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function courseQualityPoints(course) {
  const credits = Number(course.credits || 0);
  const gradePoint = courseGradePoint(course);

  return credits * gradePoint;
}

function semesterSGPA(courses = []) {
  let totalQualityPoints = 0;
  let totalCredits = 0;

  courses.forEach((course) => {
    const credits = Number(course.credits || 0);
    const gradePoint = Number(course.grade_point);

    if (
      credits > 0 &&
      Number.isFinite(gradePoint) &&
      gradePoint >= 0
    ) {
      totalQualityPoints += credits * gradePoint;
      totalCredits += credits;
    }
  });

  if (totalCredits === 0) {
    return 0;
  }

  return totalQualityPoints / totalCredits;
}

function normalizeCourse(course) {
  if (!course) {
    return course;
  }

  return {
    ...course,
    id: course.id,
    name: course.name || course.course_name || "",
    credits:
      course.credits !== null &&
      course.credits !== undefined
        ? Number(course.credits)
        : "",
    grade: course.grade || "",
    grade_point:
      course.grade_point !== null &&
      course.grade_point !== undefined
        ? Number(course.grade_point)
        : "",
    internal_obtained: course.internal_obtained ?? "",
    internal_total: course.internal_total ?? "",
    external_obtained: course.external_obtained ?? "",
    external_total: course.external_total ?? "",
    practical_internal_obtained:
      course.practical_internal_obtained ?? "",
    practical_internal_total:
      course.practical_internal_total ?? "",
    practical_external_obtained:
      course.practical_external_obtained ?? "",
    practical_external_total:
      course.practical_external_total ?? "",
  };
}

function normalizeSemester(semester) {
  return {
    ...semester,
    id: semester.id,
    name: semester.name || "",
    courses: Array.isArray(semester.courses)
      ? semester.courses.map(normalizeCourse)
      : [],
  };
}

function CgpaPage() {
  const loading = usePageLoader(280);

  const {
    semesters,
    setSemesters,
    pushToast,
  } = useApp();

  const [courseForm, setCourseForm] = useState(null);
  const [semesterForm, setSemesterForm] = useState(null);

  const [semesterName, setSemesterName] = useState(
    SEMESTERS[semesters.length] ||
      `Semester ${semesters.length + 1}`
  );

  const allCourses = useMemo(
    () =>
      semesters.flatMap(
        (semester) => semester.courses || []
      ),
    [semesters]
  );

  const totalCredits = useMemo(() => {
    return allCourses.reduce(
      (total, course) =>
        total + Number(course.credits || 0),
      0
    );
  }, [allCourses]);

  const allMarks = useMemo(() => {
    return allCourses.reduce(
      (result, course) => {
        const marks = courseMarks(course);

        result.obtained += marks.obtained;
        result.total += marks.total;

        return result;
      },
      {
        obtained: 0,
        total: 0,
      }
    );
  }, [allCourses]);

  const overallPercentage =
    allMarks.total > 0
      ? (allMarks.obtained / allMarks.total) * 100
      : 0;

  const cgpaData = useMemo(() => {
    let totalQualityPoints = 0;
    let gradedCredits = 0;

    allCourses.forEach((course) => {
      const credits = Number(course.credits || 0);
      const gradePoint = Number(course.grade_point);

      if (
        credits > 0 &&
        Number.isFinite(gradePoint) &&
        gradePoint >= 0
      ) {
        totalQualityPoints += credits * gradePoint;
        gradedCredits += credits;
      }
    });

    const cgpa =
      gradedCredits > 0
        ? totalQualityPoints / gradedCredits
        : 0;

    return {
      totalQualityPoints,
      gradedCredits,
      cgpa,
    };
  }, [allCourses]);

  async function addSemester(event) {
    event.preventDefault();

    const name = semesterName.trim();

    if (!name) {
      pushToast(
        "Semester name is required.",
        "rose"
      );
      return;
    }

    const alreadyExists = semesters.some(
      (item) =>
        item.name?.trim().toLowerCase() ===
        name.toLowerCase()
    );

    if (alreadyExists) {
      pushToast(
        "That semester is already added.",
        "amber"
      );
      return;
    }

    const token = localStorage.getItem(
      "studenthub-token"
    );

    if (!token) {
      pushToast("Please login again.", "rose");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/semester`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to add semester"
        );
      }

      const newSemester = await response.json();

      const normalizedSemester =
        normalizeSemester({
          ...newSemester,
          name:
            newSemester.name || name,
          courses:
            newSemester.courses || [],
        });

      setSemesters((current) => [
        ...current,
        normalizedSemester,
      ]);

      pushToast(
        `${name} added.`,
        "green"
      );

      setSemesterName(
        SEMESTERS[semesters.length + 1] ||
          `Semester ${semesters.length + 2}`
      );
    } catch (error) {
      console.error(
        "ADD SEMESTER ERROR:",
        error
      );

      pushToast(
        error.message ||
          "Failed to save semester to MySQL.",
        "rose"
      );
    }
  }

  async function saveSemester(event) {
    event.preventDefault();

    if (!semesterForm) {
      return;
    }

    const name = semesterForm.name.trim();

    if (!name) {
      pushToast(
        "Semester name is required.",
        "rose"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/semester/${semesterForm.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to update semester"
        );
      }

      setSemesters((current) =>
        current.map((semester) =>
          String(semester.id) ===
          String(semesterForm.id)
            ? {
                ...semester,
                name,
              }
            : semester
        )
      );

      setSemesterForm(null);

      pushToast(
        "Semester updated successfully.",
        "green"
      );
    } catch (error) {
      console.error(
        "SAVE SEMESTER ERROR:",
        error
      );

      pushToast(
        error.message ||
          "Failed to update semester in MySQL.",
        "rose"
      );
    }
  }

  async function removeSemester(semesterId) {
    const confirmed = window.confirm(
      "Delete this semester and all its subjects?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/semester/${semesterId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to delete semester"
        );
      }

      setSemesters((current) =>
        current.filter(
          (semester) =>
            String(semester.id) !==
            String(semesterId)
        )
      );

      pushToast(
        "Semester deleted successfully.",
        "amber"
      );
    } catch (error) {
      console.error(
        "REMOVE SEMESTER ERROR:",
        error
      );

      pushToast(
        error.message ||
          "Failed to delete semester from MySQL.",
        "rose"
      );
    }
  }

  async function saveCourse(event) {
    event.preventDefault();

    if (!courseForm) {
      return;
    }

    const name = courseForm.name.trim();
    const credits = Number(courseForm.credits);
    const gradePoint = numberOrNull(
      courseForm.grade_point
    );

    if (!name) {
      pushToast(
        "Subject name is required.",
        "rose"
      );
      return;
    }

    if (!Number.isFinite(credits) || credits <= 0) {
      pushToast(
        "Please enter valid credits.",
        "rose"
      );
      return;
    }

    if (
      gradePoint === null ||
      gradePoint < 0 ||
      gradePoint > 10
    ) {
      pushToast(
        "Grading point must be between 0 and 10.",
        "rose"
      );
      return;
    }

    try {
      const isEditing = Boolean(courseForm.id);

      const url = isEditing
        ? `${API_URL}/course/${courseForm.id}`
        : `${API_URL}/semester/${courseForm.semesterId}/course`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const body = {
        name,
        credits,
        grade_point: gradePoint,

        internal_obtained: numberOrNull(
          courseForm.internal_obtained
        ),

        internal_total: numberOrNull(
          courseForm.internal_total
        ),

        external_obtained: numberOrNull(
          courseForm.external_obtained
        ),

        external_total: numberOrNull(
          courseForm.external_total
        ),

        practical_internal_obtained:
          numberOrNull(
            courseForm.practical_internal_obtained
          ),

        practical_internal_total:
          numberOrNull(
            courseForm.practical_internal_total
          ),

        practical_external_obtained:
          numberOrNull(
            courseForm.practical_external_obtained
          ),

        practical_external_total:
          numberOrNull(
            courseForm.practical_external_total
          ),
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to save subject"
        );
      }

      const savedCourse =
        await response.json();

      const normalizedCourse =
        normalizeCourse({
          ...body,
          ...savedCourse,
          id:
            savedCourse?.id ||
            courseForm.id,
          name:
            savedCourse?.name ||
            savedCourse?.course_name ||
            name,
          credits:
            savedCourse?.credits ??
            credits,
          grade:
            savedCourse?.grade ??
            courseForm.grade ??
            "",
          grade_point:
            savedCourse?.grade_point ??
            gradePoint,
        });

      setSemesters((current) =>
        current.map((semester) => {
          if (
            String(semester.id) !==
            String(courseForm.semesterId)
          ) {
            return semester;
          }

          const courses =
            semester.courses || [];

          if (isEditing) {
            return {
              ...semester,
              courses: courses.map(
                (course) =>
                  String(course.id) ===
                  String(courseForm.id)
                    ? {
                        ...course,
                        ...normalizedCourse,
                      }
                    : course
              ),
            };
          }

          return {
            ...semester,
            courses: [
              ...courses,
              normalizedCourse,
            ],
          };
        })
      );

      setCourseForm(null);

      pushToast(
        isEditing
          ? "Subject updated successfully."
          : "Subject added successfully.",
        "green"
      );
    } catch (error) {
      console.error(
        "SAVE COURSE ERROR:",
        error
      );

      pushToast(
        error.message ||
          "Failed to save subject to MySQL.",
        "rose"
      );
    }
  }

  async function removeCourse(
    semesterId,
    courseId
  ) {
    try {
      const response = await fetch(
        `${API_URL}/course/${courseId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to delete subject"
        );
      }

      setSemesters((current) =>
        current.map((semester) =>
          String(semester.id) ===
          String(semesterId)
            ? {
                ...semester,
                courses: (
                  semester.courses || []
                ).filter(
                  (course) =>
                    String(course.id) !==
                    String(courseId)
                ),
              }
            : semester
        )
      );

      pushToast(
        "Subject removed successfully.",
        "amber"
      );
    } catch (error) {
      console.error(
        "REMOVE COURSE ERROR:",
        error
      );

      pushToast(
        error.message ||
          "Failed to remove subject from MySQL.",
        "rose"
      );
    }
  }

  function openAddCourse(semesterId) {
    setCourseForm({
      semesterId,
      name: SUBJECTS[0] || "",
      credits: 3,
      grade: "",
      grade_point: "",
      internal_obtained: "",
      internal_total: "",
      external_obtained: "",
      external_total: "",
      practical_internal_obtained: "",
      practical_internal_total: "",
      practical_external_obtained: "",
      practical_external_total: "",
    });
  }

  function openEditCourse(
    semesterId,
    course
  ) {
    setCourseForm({
      ...normalizeCourse(course),
      semesterId,
    });
  }

  function updateCourseForm(field, value) {
    setCourseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (loading) {
    return <Loader label="Loading CGPA" />;
  }

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <p className="eyebrow">
            Academic Record
          </p>

          <h1>CGPA</h1>

          <p className="lede">
            Enter your subject credits, marks
            and grading point. CGPA is
            calculated automatically using
            credit-weighted grading points.
          </p>
        </div>

        <form
          className="inline-form"
          onSubmit={addSemester}
        >
          <select
            value={semesterName}
            onChange={(event) =>
              setSemesterName(
                event.target.value
              )
            }
          >
            {SEMESTERS.map((name) => (
              <option
                key={name}
                value={name}
              >
                {name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn"
          >
            Add semester
          </button>
        </form>
      </section>

      <section className="stats-grid">
        <StatCard
          label="CGPA"
          value={
            cgpaData.gradedCredits > 0
              ? cgpaData.cgpa.toFixed(2)
              : "—"
          }
          hint={
            cgpaData.gradedCredits > 0
              ? "Credit-weighted grading point"
              : "Enter grading points"
          }
          tone="indigo"
          icon="cap"
        />

        <StatCard
          label="Overall Percentage"
          value={`${overallPercentage.toFixed(
            2
          )}%`}
          hint={`${allMarks.obtained} / ${allMarks.total} marks`}
          tone="green"
          icon="spark"
        />

        <StatCard
          label="Credits"
          value={totalCredits}
          hint={`${allCourses.length} subjects`}
          tone="amber"
          icon="book"
        />

        <StatCard
          label="Subjects"
          value={allCourses.length}
          hint={`${semesters.length} semester${
            semesters.length === 1
              ? ""
              : "s"
          }`}
          tone="indigo"
          icon="notes"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>CGPA summary</h2>

            <p className="muted">
              CGPA is calculated from the
              grading point entered for each
              subject and weighted according
              to credits.
            </p>
          </div>

          <strong style={{ fontSize: 24 }}>
            {cgpaData.gradedCredits > 0
              ? cgpaData.cgpa.toFixed(2)
              : "—"}
          </strong>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Total Credits</th>
                <th>Quality Points</th>
                <th>CGPA</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  {cgpaData.gradedCredits}
                </td>

                <td>
                  {cgpaData.totalQualityPoints.toFixed(
                    2
                  )}
                </td>

                <td>
                  <strong>
                    {cgpaData.gradedCredits > 0
                      ? cgpaData.cgpa.toFixed(2)
                      : "—"}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              Semester-wise overview
            </h2>

            <p className="muted">
              SGPA is calculated separately
              for every semester.
            </p>
          </div>
        </div>

        {semesters.length === 0 ? (
          <EmptyState
            title="No semesters yet"
            copy="Add a semester, then enter your subjects."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Subjects</th>
                  <th>Credits</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>SGPA</th>
                </tr>
              </thead>

              <tbody>
                {semesters.map(
                  (semester) => {
                    const courses =
                      semester.courses || [];

                    const marks =
                      semesterMarks(courses);

                    const percentageValue =
                      marks.total > 0
                        ? (marks.obtained /
                            marks.total) *
                          100
                        : 0;

                    const semesterCredits =
                      courses.reduce(
                        (sum, course) =>
                          sum +
                          Number(
                            course.credits || 0
                          ),
                        0
                      );

                    const sgpa =
                      semesterSGPA(courses);

                    return (
                      <tr
                        key={semester.id}
                      >
                        <td>
                          <strong>
                            {semester.name}
                          </strong>
                        </td>

                        <td>
                          {courses.length}
                        </td>

                        <td>
                          {semesterCredits}
                        </td>

                        <td>
                          {marks.obtained} /{" "}
                          {marks.total}
                        </td>

                        <td>
                          {percentageValue.toFixed(
                            2
                          )}
                          %
                        </td>

                        <td>
                          <strong>
                            {semesterCredits >
                            0
                              ? sgpa.toFixed(
                                  2
                                )
                              : "—"}
                          </strong>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {semesters.map((semester) => {
        const courses =
          semester.courses || [];

        const marks =
          semesterMarks(courses);

        const semesterPercentage =
          marks.total > 0
            ? (marks.obtained /
                marks.total) *
              100
            : 0;

        const semesterCredits =
          courses.reduce(
            (sum, course) =>
              sum +
              Number(course.credits || 0),
            0
          );

        const sgpa =
          semesterSGPA(courses);

        return (
          <section
            key={semester.id}
            className="panel"
          >
            <div className="panel-header">
              <div>
                <h2>{semester.name}</h2>

                <p className="muted">
                  {courses.length} subject
                  {courses.length === 1
                    ? ""
                    : "s"}{" "}
                  · {semesterCredits} credits ·{" "}
                  {semesterPercentage.toFixed(
                    2
                  )}
                  % marks · SGPA:{" "}
                  <strong>
                    {semesterCredits > 0
                      ? sgpa.toFixed(2)
                      : "—"}
                  </strong>
                </p>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() =>
                    setSemesterForm({
                      id: semester.id,
                      name: semester.name,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="btn ghost"
                  onClick={() =>
                    removeSemester(
                      semester.id
                    )
                  }
                >
                  Delete
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    openAddCourse(
                      semester.id
                    )
                  }
                >
                  Add subject
                </button>
              </div>
            </div>

            {courses.length === 0 ? (
              <p className="muted">
                No subjects added yet. Click
                "Add subject" to enter credits,
                marks and grading point.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Credits</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade Point</th>
                      <th>Quality Points</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {courses.map(
                      (course) => {
                        const marks =
                          courseMarks(course);

                        const percentageValue =
                          coursePercentage(
                            course
                          );

                        const gradePoint =
                          courseGradePoint(
                            course
                          );

                        const qualityPoints =
                          courseQualityPoints(
                            course
                          );

                        return (
                          <tr
                            key={course.id}
                          >
                            <td>
                              <strong>
                                {course.name}
                              </strong>
                            </td>

                            <td>
                              {course.credits}
                            </td>

                            <td>
                              {marks.obtained} /{" "}
                              {marks.total}
                            </td>

                            <td>
                              <span className="pill">
                                {percentageValue.toFixed(
                                  2
                                )}
                                %
                              </span>
                            </td>

                            <td>
                              <strong>
                                {Number.isFinite(
                                  Number(
                                    course.grade_point
                                  )
                                )
                                  ? Number(
                                      course.grade_point
                                    ).toFixed(
                                      2
                                    )
                                  : "—"}
                              </strong>
                            </td>

                            <td>
                              {Number.isFinite(
                                Number(
                                  course.grade_point
                                )
                              )
                                ? qualityPoints.toFixed(
                                    2
                                  )
                                : "—"}
                            </td>

                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="text-btn"
                                  onClick={() =>
                                    openEditCourse(
                                      semester.id,
                                      course
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="text-btn danger"
                                  onClick={() =>
                                    removeCourse(
                                      semester.id,
                                      course.id
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div
              className="sgpa-bar"
              style={{ marginTop: 18 }}
            >
              <span>SGPA</span>

              <div
                className="progress-track"
                aria-hidden="true"
              >
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (sgpa / 10) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <strong>
                {semesterCredits > 0
                  ? sgpa.toFixed(2)
                  : "—"}
              </strong>
            </div>
          </section>
        );
      })}

      {courseForm ? (
        <Modal
          title={
            courseForm.id
              ? "Update subject"
              : "Add subject"
          }
          onClose={() =>
            setCourseForm(null)
          }
          footer={
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setCourseForm(null)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                form="course-form"
                className="btn"
              >
                Save subject
              </button>
            </>
          }
        >
          <form
            id="course-form"
            className="form-grid"
            onSubmit={saveCourse}
          >
            <label className="full">
              Subject name

              <input
                list="subject-list"
                value={courseForm.name}
                onChange={(event) =>
                  updateCourseForm(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Data Structures"
                required
              />

              <datalist id="subject-list">
                {SUBJECTS.map(
                  (subject) => (
                    <option
                      key={subject}
                      value={subject}
                    />
                  )
                )}
              </datalist>
            </label>

            <label>
              Credits

              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={courseForm.credits}
                onChange={(event) =>
                  updateCourseForm(
                    "credits",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Grading Point

              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={
                  courseForm.grade_point
                }
                onChange={(event) =>
                  updateCourseForm(
                    "grade_point",
                    event.target.value
                  )
                }
                placeholder="Example: 8.5"
                required
              />
            </label>

            <label>
              Grade

              <input
                value={
                  courseForm.grade || ""
                }
                onChange={(event) =>
                  updateCourseForm(
                    "grade",
                    event.target.value
                  )
                }
                placeholder="Example: A+"
              />
            </label>

            <div className="full">
              <strong>
                Theory Internal
              </strong>

              <div
                className="form-grid"
                style={{ marginTop: 8 }}
              >
                <label>
                  Obtained marks

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      courseForm.internal_obtained
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "internal_obtained",
                        event.target.value
                      )
                    }
                    placeholder="32"
                  />
                </label>

                <label>
                  Total marks

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      courseForm.internal_total
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "internal_total",
                        event.target.value
                      )
                    }
                    placeholder="40"
                  />
                </label>
              </div>
            </div>

            <div className="full">
              <strong>
                Theory External
              </strong>

              <div
                className="form-grid"
                style={{ marginTop: 8 }}
              >
                <label>
                  Obtained marks

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      courseForm.external_obtained
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "external_obtained",
                        event.target.value
                      )
                    }
                    placeholder="52"
                  />
                </label>

                <label>
                  Total marks

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      courseForm.external_total
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "external_total",
                        event.target.value
                      )
                    }
                    placeholder="60"
                  />
                </label>
              </div>
            </div>

            <div className="full">
              <strong>
                Practical Internal
              </strong>

              <div
                className="form-grid"
                style={{ marginTop: 8 }}
              >
                <label>
                  Obtained marks

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      courseForm.practical_internal_obtained
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "practical_internal_obtained",
                        event.target.value
                      )
                    }
                    placeholder="18"
                  />
                </label>

                <label>
                  Total marks

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      courseForm.practical_internal_total
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "practical_internal_total",
                        event.target.value
                      )
                    }
                    placeholder="20"
                  />
                </label>
              </div>
            </div>

            <div className="full">
              <strong>
                Practical External
              </strong>

              <div
                className="form-grid"
                style={{ marginTop: 8 }}
              >
                <label>
                  Obtained marks

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      courseForm.practical_external_obtained
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "practical_external_obtained",
                        event.target.value
                      )
                    }
                    placeholder="42"
                  />
                </label>

                <label>
                  Total marks

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      courseForm.practical_external_total
                    }
                    onChange={(event) =>
                      updateCourseForm(
                        "practical_external_total",
                        event.target.value
                      )
                    }
                    placeholder="50"
                  />
                </label>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}

      {semesterForm ? (
        <Modal
          title="Edit semester"
          onClose={() =>
            setSemesterForm(null)
          }
          footer={
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setSemesterForm(null)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                form="semester-form"
                className="btn"
              >
                Save changes
              </button>
            </>
          }
        >
          <form
            id="semester-form"
            className="form-grid"
            onSubmit={saveSemester}
          >
            <label className="full">
              Semester name

              <input
                value={semesterForm.name}
                onChange={(event) =>
                  setSemesterForm(
                    (current) => ({
                      ...current,
                      name: event.target.value,
                    })
                  )
                }
                required
              />
            </label>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export default CgpaPage;