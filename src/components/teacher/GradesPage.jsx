"use client"

import { useState, useEffect, useRef } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Save, Users, Keyboard } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { toast } from "../ui/toastApi"
import Button from "../ui/Button"
import { SelectField } from "../ui/Field"
import { LoadingState, EmptyState, ErrorState } from "../ui/States"

const TERMS = ["prelim", "midterm", "semifinal", "final"]
const TERM_LABELS = {
  prelim: "Prelim",
  midterm: "Midterm",
  semifinal: "Semi-Final",
  final: "Final",
}

const emptyTerms = () => ({ prelim: null, midterm: null, semifinal: null, final: null })

export default function GradesPage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [gradeRecords, setGradeRecords] = useState([])
  const [currentGrades, setCurrentGrades] = useState({})
  const [savedGrades, setSavedGrades] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("raw")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const tabRefs = useRef([])

  const fetchData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [subjectsResult, studentsResult, gradesResult] = await Promise.all([
        supabase.from("subjects").select("*"),
        supabase.from("students").select("*"),
        supabase.from("grades").select("*"),
      ])
      if (subjectsResult.error) throw subjectsResult.error
      if (studentsResult.error) throw studentsResult.error
      if (gradesResult.error) throw gradesResult.error
      setSubjects(subjectsResult.data ?? [])
      setStudents(studentsResult.data ?? [])
      setGradeRecords(gradesResult.data ?? [])
    } catch (error) {
      setLoadError(error.message || "Grades could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedSubject) return
    let cancelled = false

    const fetchGrades = async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("subject_id", selectedSubject)

      if (cancelled) return
      if (error) {
        toast.error("Saved grades for this subject could not be loaded: " + error.message)
        return
      }

      const existingRecords = data || []
      const gradesMap = {}
      const studentsInSubject = students.filter((student) =>
        student.subjects?.includes(selectedSubject)
      )

      // Unentered terms stay null. They are never written to the database and
      // never rendered as 0.00, so a half-finished sheet can't invent grades.
      studentsInSubject.forEach((student) => {
        gradesMap[student.id] = emptyTerms()
      })

      existingRecords.forEach((record) => {
        if (!gradesMap[record.student_id]) gradesMap[record.student_id] = emptyTerms()
        gradesMap[record.student_id][record.term] = record.grade
      })

      setCurrentGrades(gradesMap)
      setSavedGrades(structuredClone(gradesMap))
    }

    fetchGrades()
    return () => {
      cancelled = true
    }
  }, [selectedSubject, gradeRecords, students])

  const studentsInSubject = students.filter((student) =>
    selectedSubject ? student.subjects?.includes(selectedSubject) : false
  )

  const handleGradeChange = (studentId, term, value) => {
    setCurrentGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [term]: value === "" ? null : Number.parseFloat(value),
      },
    }))
  }

  const cellErrors = Object.entries(currentGrades).flatMap(([studentId, terms]) =>
    TERMS.filter((term) => {
      const value = terms[term]
      return value !== null && (!Number.isFinite(value) || value < 1 || value > 5)
    }).map((term) => ({ studentId, term }))
  )

  const saveGrades = async () => {
    if (!selectedSubject) return
    if (cellErrors.length > 0) {
      toast.error(
        `${cellErrors.length} grade${cellErrors.length === 1 ? "" : "s"} outside the 1.00-5.00 range. Fix them before saving.`
      )
      return
    }

    const recordsToUpsert = Object.entries(currentGrades).flatMap(([studentId, terms]) =>
      TERMS.filter((term) => terms[term] !== null).map((term) => ({
        subject_id: selectedSubject,
        student_id: studentId,
        term,
        grade: terms[term],
      }))
    )

    // A cell the teacher cleared becomes a real deletion, not a silent 0.
    const recordsToDelete = Object.entries(currentGrades).flatMap(([studentId, terms]) =>
      TERMS.filter(
        (term) =>
          terms[term] === null &&
          savedGrades[studentId] &&
          savedGrades[studentId][term] !== null &&
          savedGrades[studentId][term] !== undefined
      ).map((term) => ({
        subject_id: selectedSubject,
        student_id: studentId,
        term,
      }))
    )

    if (recordsToUpsert.length === 0 && recordsToDelete.length === 0) {
      toast.warning("Nothing to save: no grades have been entered.")
      return
    }

    setIsSaving(true)

    let error = null
    if (recordsToUpsert.length > 0) {
      const result = await supabase
        .from("grades")
        .upsert(recordsToUpsert, { onConflict: ["subject_id", "student_id", "term"] })
      error = result.error
    }
    if (!error && recordsToDelete.length > 0) {
      const result = await supabase.from("grades").delete().match({
        subject_id: selectedSubject,
      }).in(
        "student_id",
        [...new Set(recordsToDelete.map((record) => record.student_id))]
      ).in(
        "term",
        [...new Set(recordsToDelete.map((record) => record.term))]
      )
      error = result.error
    }

    if (error) {
      toast.error("Grades were not saved: " + error.message)
      setIsSaving(false)
      return
    }

    const { data } = await supabase
      .from("grades")
      .select("*")
      .eq("subject_id", selectedSubject)

    setGradeRecords(data || [])
    setSavedGrades(structuredClone(currentGrades))
    setIsSaving(false)

    const cleared = recordsToDelete.length
    toast.success(
      `Saved ${recordsToUpsert.length} grade${recordsToUpsert.length === 1 ? "" : "s"}` +
        (cleared ? `, cleared ${cleared}` : "") +
        "."
    )
  }

  const calculateCumulativeGrades = () => {
    const cumulativeGrades = {}

    studentsInSubject.forEach((student) => {
      const studentGrades = currentGrades[student.id] || emptyTerms()

      const set = (value) => (value === null || value === undefined ? null : value)
      const prelim = set(studentGrades.prelim)
      const midterm = set(studentGrades.midterm)
      const semifinal = set(studentGrades.semifinal)
      const final = set(studentGrades.final)

      // Each step averages only the terms actually entered, so a missing
      // midterm is skipped instead of dragging the running average to 0.
      const running = []
      if (prelim !== null) running.push(prelim)
      if (midterm !== null) running.push(midterm)
      if (semifinal !== null) running.push(semifinal)
      if (final !== null) running.push(final)

      const averageAfter = (count) =>
        count === 0 ? null : running.slice(0, count).reduce((sum, n) => sum + n, 0) / count

      cumulativeGrades[student.id] = {
        prelim,
        midterm: averageAfter(Math.min(running.length, 2)),
        semifinal: averageAfter(Math.min(running.length, 3)),
        final: averageAfter(Math.min(running.length, 4)),
        hasFinal: final !== null,
        enteredCount: running.length,
      }
    })

    return cumulativeGrades
  }

  const cumulativeGrades = calculateCumulativeGrades()
  const isPassingGrade = (grade) => grade !== null && grade <= 3.0

  const handleTabKeyDown = (event, index) => {
    const forward = event.key === "ArrowRight"
    const backward = event.key === "ArrowLeft"
    if (!forward && !backward) return
    event.preventDefault()
    const count = TABS.length
    const next = forward ? (index + 1) % count : (index - 1 + count) % count
    const target = tabRefs.current[next]
    if (target) {
      target.focus()
      setActiveTab(target.dataset.tab)
    }
  }

  const TABS = [
    { id: "raw", label: "Raw Grades" },
    { id: "cumulative", label: "Cumulative Grades" },
  ]

  const gradeCellClass =
    "min-h-11 w-24 rounded-md border border-gray-500 bg-white px-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 aria-invalid:border-red-700"

  return (
    <TeacherLayout title="Grades">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Manage Grades</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Select Subject</h3>
          </div>
          <div className="p-4">
            <SelectField
              id="subject"
              label="Subject"
              hint="Grades are saved per subject, per term."
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      {loading && <LoadingState label="Loading grades" />}
      {loadError && <ErrorState message={loadError} onRetry={fetchData} />}

      {selectedSubject && !loading && !loadError && (
        <div>
          <div className="mb-4">
            <div className="flex border-b border-gray-200" role="tablist" aria-label="Grade views">
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  data-tab={tab.id}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={`min-h-11 px-4 ${
                    activeTab === tab.id
                      ? "border-b-2 border-red-600 font-medium text-gray-900"
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
              id="panel-raw"
              aria-labelledby="tab-raw"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Raw Grades</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {subjects.find((s) => s.id === selectedSubject)?.name}
                  <span className="ml-2 font-medium text-red-700">
                    ({studentsInSubject.length} students)
                  </span>
                </p>
                <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                  <Keyboard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Enter 1.00 to 5.00. Leave a cell blank if the term has no grade yet -
                    blanks are not saved and never show as 0.00.
                  </span>
                </p>
              </div>
              <div className="p-4">
                {studentsInSubject.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No students enrolled in this subject"
                    description="Open Students and add this subject to at least one student before entering grades."
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th scope="col" className="p-2 text-left text-sm font-medium text-gray-600">Student</th>
                            {TERMS.map((term) => (
                              <th scope="col" key={term} className="p-2 text-left text-sm font-medium text-gray-600">
                                {TERM_LABELS[term]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {studentsInSubject.map((student) => (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                                    {student.photo ? (
                                      <img
                                        src={student.photo}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs text-gray-700 font-medium">
                                        {student.full_name?.split(" ").map((n) => n[0]).join("")}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-900">{student.full_name}</span>
                                </div>
                              </td>
                              {TERMS.map((term) => {
                                const value = currentGrades[student.id]?.[term]
                                const invalid =
                                  value !== null &&
                                  value !== undefined &&
                                  (!Number.isFinite(value) || value < 1 || value > 5)
                                return (
                                  <td key={term} className="p-2">
                                    <label htmlFor={`grade-${student.id}-${term}`} className="sr-only">
                                      {TERM_LABELS[term]} grade for {student.full_name}
                                    </label>
                                    <input
                                      id={`grade-${student.id}-${term}`}
                                      type="number"
                                      min="1"
                                      max="5"
                                      step="0.1"
                                      inputMode="decimal"
                                      placeholder="-"
                                      aria-invalid={invalid || undefined}
                                      value={value === null || value === undefined ? "" : value}
                                      onChange={(e) =>
                                        handleGradeChange(student.id, term, e.target.value)
                                      }
                                      className={gradeCellClass}
                                    />
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-600" aria-live="polite">
                        {cellErrors.length > 0
                          ? `${cellErrors.length} grade${cellErrors.length === 1 ? "" : "s"} outside 1.00-5.00 - fix them to enable saving`
                          : `${Object.values(currentGrades).reduce(
                              (total, terms) =>
                                total + TERMS.filter((term) => terms[term] !== null).length,
                              0
                            )} grades entered`}
                      </p>
                      <div className="flex justify-end">
                        <Button onClick={saveGrades} disabled={isSaving || cellErrors.length > 0}>
                          {isSaving ? "Saving..." : "Save Grades"}
                          <Save className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "cumulative" && (
            <div
              role="tabpanel"
              id="panel-cumulative"
              aria-labelledby="tab-cumulative"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Cumulative Grades</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {subjects.find((s) => s.id === selectedSubject)?.name}
                  <span className="ml-2 font-medium text-red-700">
                    ({studentsInSubject.length} students)
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Running average of the terms entered so far. A student is marked
                  <span className="font-medium text-gray-900"> Passed </span> only once a
                  final grade exists and is 3.00 or better.
                </p>
              </div>
              <div className="p-4">
                {studentsInSubject.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No students enrolled in this subject"
                    description="Open Students and add this subject to at least one student before entering grades."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th scope="col" className="p-2 text-left text-sm font-medium text-gray-600">Student</th>
                          {TERMS.map((term) => (
                            <th scope="col" key={term} className="p-2 text-left text-sm font-medium text-gray-600">
                              {TERM_LABELS[term]}
                            </th>
                          ))}
                          <th scope="col" className="p-2 text-left text-sm font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSubject.map((student) => {
                          const g = cumulativeGrades[student.id] || {}
                          const hasFinal = Boolean(g.hasFinal)
                          const isPassing = hasFinal && isPassingGrade(g.final)

                          return (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                                    {student.photo ? (
                                      <img src={student.photo} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-gray-700 font-medium">
                                        {student.full_name?.split(" ").map((n) => n[0]).join("")}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-900">{student.full_name}</span>
                                </div>
                              </td>
                              {TERMS.map((term) => {
                                const value = g[term]
                                const failing =
                                  value !== null && value !== undefined && !isPassingGrade(value)
                                return (
                                  <td
                                    key={term}
                                    className={`p-2 text-sm ${
                                      failing ? "font-semibold text-red-700" : "text-gray-800"
                                    }`}
                                  >
                                    {value === null || value === undefined ? (
                                      <span className="text-gray-600">-</span>
                                    ) : (
                                      <>
                                        {value.toFixed(2)}
                                        {failing && (
                                          <span className="sr-only"> (failing)</span>
                                        )}
                                      </>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="p-2">
                                {!hasFinal ? (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                    Incomplete
                                  </span>
                                ) : isPassing ? (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                    Passed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                                    Failed
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </TeacherLayout>
  )
}
