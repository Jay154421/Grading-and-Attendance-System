import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/student-layout";
import { GraduationCap } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { SelectField } from "../ui/Field";
import { LoadingState, EmptyState, ErrorState } from "../ui/States";

const TERMS = ["prelim", "midterm", "semifinal", "final"];
const TERM_LABELS = {
  prelim: "Prelim",
  midterm: "Midterm",
  semifinal: "Semi-Final",
  final: "Final",
};

const emptyTerms = () => ({ prelim: null, midterm: null, semifinal: null, final: null });

export default function StudentGradesPage() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeTab, setActiveTab] = useState("raw");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tabRefs = useRef([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        navigate("/", { replace: true });
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, subjects")
        .eq("email", user.email)
        .single();

      if (studentError) throw studentError;
      if (!studentData) throw new Error("Student record not found");

      let enrolledSubjectIds = [];
      if (studentData.subjects) {
        try {
          enrolledSubjectIds = Array.isArray(studentData.subjects)
            ? studentData.subjects
            : JSON.parse(studentData.subjects);
        } catch {
          enrolledSubjectIds = [];
        }
      }

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .in("id", enrolledSubjectIds);
      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentData.id)
        .in("subject_id", enrolledSubjectIds);
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);
    } catch (err) {
      setError(err.message || "Failed to load grade data");
    } finally {
      setLoading(false);
    }
  };

  // Mount-only fetch: the retry button calls this same function.
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Every enrolled subject is listed, including ones with no grades on record.
  const rows = subjects
    .filter((subject) => !selectedSubject || subject.id === selectedSubject)
    .map((subject) => {
      const terms = emptyTerms();
      grades
        .filter((grade) => grade.subject_id === subject.id)
        .forEach((grade) => {
          if (Object.prototype.hasOwnProperty.call(terms, grade.term)) {
            terms[grade.term] = grade.grade;
          }
        });
      return { subject, terms };
    });

  const calculateCumulativeGrades = (terms) => {
    const entered = TERMS.map((term) => terms[term]).filter(
      (value) => value !== null && value !== undefined
    );
    const averageUpTo = (count) =>
      count === 0
        ? null
        : entered.slice(0, count).reduce((sum, value) => sum + value, 0) / count;

    return {
      prelim: averageUpTo(Math.min(entered.length, 1)),
      midterm: averageUpTo(Math.min(entered.length, 2)),
      semifinal: averageUpTo(Math.min(entered.length, 3)),
      final: averageUpTo(Math.min(entered.length, 4)),
      hasFinal: terms.final !== null && terms.final !== undefined,
    };
  };

  const isFailing = (grade) => grade !== null && grade !== undefined && grade > 3.0;

  const valueCell = (grade) => {
    if (grade === null || grade === undefined) return <span className="text-gray-600">-</span>;
    return (
      <span className={isFailing(grade) ? "font-semibold text-red-700" : "text-gray-900"}>
        {grade.toFixed(2)}
        {isFailing(grade) && <span className="sr-only"> (failing)</span>}
      </span>
    );
  };

  const StatusChip = ({ terms }) => {
    const cumulative = calculateCumulativeGrades(terms);
    if (!cumulative.hasFinal) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          Pending
        </span>
      );
    }
    const passing = cumulative.final <= 3.0;
    return passing ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
        Passed
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
        Failed
      </span>
    );
  };

  const TABS = [
    { id: "raw", label: "Raw Grades" },
    { id: "cumulative", label: "Cumulative Grades" },
  ];

  const handleTabKeyDown = (event, index) => {
    const forward = event.key === "ArrowRight";
    const backward = event.key === "ArrowLeft";
    if (!forward && !backward) return;
    event.preventDefault();
    const count = TABS.length;
    const next = forward ? (index + 1) % count : (index - 1 + count) % count;
    const target = tabRefs.current[next];
    if (target) {
      target.focus();
      setActiveTab(target.dataset.tab);
    }
  };

  const headerClass = "bg-canvas";
  const thClass =
    "p-3 text-left text-sm font-medium text-gray-600";
  const rowClass = "border-b border-gray-100 hover:bg-canvas";

  const subjectName = selectedSubject
    ? subjects.find((s) => s.id === selectedSubject)?.name
    : "All Subjects";

  return (
    <StudentLayout title="Grades">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">My Grades</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-canvas">
            <h3 className="text-lg font-semibold text-gray-900">Filter by Subject</h3>
          </div>
          <div className="p-4">
            <SelectField
              id="subject"
              label="Subject"
              hint="Leave as All subjects to see every subject you are enrolled in."
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex border-b border-gray-200" role="tablist" aria-label="Grade views">
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`student-tab-${tab.id}`}
                  data-tab={tab.id}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`student-panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={`min-h-11 px-4 ${
                    activeTab === tab.id
                      ? "border-b-2 border-brand font-medium text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "raw" && (
            <div
              role="tabpanel"
              id="student-panel-raw"
              aria-labelledby="student-tab-raw"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200 bg-canvas">
                <h3 className="text-lg font-semibold text-gray-900">Raw Grades</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {subjectName}
                  <span className="ml-2 font-medium text-brand">
                    ({rows.length} subject{rows.length === 1 ? "" : "s"})
                  </span>
                </p>
              </div>
              <div className="p-4">
                {loading ? (
                  <LoadingState label="Loading grades data" />
                ) : rows.length === 0 ? (
                  <EmptyState
                    icon={GraduationCap}
                    title="No subjects to show"
                    description="You are not enrolled in any subject yet."
                  />
                ) : rows.every((row) => TERMS.every((term) => row.terms[term] === null)) ? (
                  <EmptyState
                    icon={GraduationCap}
                    title="No grades recorded yet"
                    description="Your teacher has not posted any grades for these subjects."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className={headerClass}>
                        <tr>
                          <th scope="col" className={thClass}>Subject</th>
                          {TERMS.map((term) => (
                            <th scope="col" key={term} className={thClass}>
                              {TERM_LABELS[term]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ subject, terms }) => (
                          <tr key={subject.id} className={rowClass}>
                            <td className="p-3 text-sm text-gray-900">
                              {subject.code} - {subject.name}
                            </td>
                            {TERMS.map((term) => (
                              <td key={term} className="p-3 text-sm">
                                {valueCell(terms[term])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "cumulative" && (
            <div
              role="tabpanel"
              id="student-panel-cumulative"
              aria-labelledby="student-tab-cumulative"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200 bg-canvas">
                <h3 className="text-lg font-semibold text-gray-900">Cumulative Grades</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {subjectName}
                  <span className="ml-2 font-medium text-brand">
                    ({rows.length} subject{rows.length === 1 ? "" : "s"})
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Running average of the terms posted so far. A subject is marked
                  <span className="font-medium text-gray-900"> Passed </span> only once a
                  final grade exists and is 3.00 or better.
                </p>
              </div>
              <div className="p-4">
                {loading ? (
                  <LoadingState label="Loading cumulative grades" />
                ) : rows.length === 0 ? (
                  <EmptyState
                    icon={GraduationCap}
                    title="No subjects to show"
                    description="You are not enrolled in any subject yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className={headerClass}>
                        <tr>
                          <th scope="col" className={thClass}>Subject</th>
                          {TERMS.map((term) => (
                            <th scope="col" key={term} className={thClass}>
                              {TERM_LABELS[term]}
                            </th>
                          ))}
                          <th scope="col" className={thClass}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ subject, terms }) => {
                          const cumulative = calculateCumulativeGrades(terms);
                          return (
                            <tr key={subject.id} className={rowClass}>
                              <td className="p-3 text-sm text-gray-900">
                                {subject.code} - {subject.name}
                              </td>
                              {TERMS.map((term) => (
                                <td key={term} className="p-3 text-sm">
                                  {valueCell(cumulative[term])}
                                </td>
                              ))}
                              <td className="p-3">
                                <StatusChip terms={terms} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}
