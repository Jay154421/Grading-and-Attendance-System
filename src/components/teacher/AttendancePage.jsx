import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Save, Users, ClipboardList } from "lucide-react"
import { format, parseISO } from "date-fns"
import { supabase } from "../../lib/supabaseClient"
import { toast } from "../ui/toastApi"
import Button from "../ui/Button"
import { SelectField, TextField } from "../ui/Field"
import { LoadingState, EmptyState, ErrorState } from "../ui/States"

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
]

export default function AttendancePage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [currentAttendance, setCurrentAttendance] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [subjectsResult, studentsResult] = await Promise.all([
        supabase.from("subjects").select("*"),
        supabase.from("students").select("*"),
      ])
      if (subjectsResult.error) throw subjectsResult.error
      if (studentsResult.error) throw studentsResult.error
      setSubjects(subjectsResult.data ?? [])
      setStudents(studentsResult.data ?? [])
    } catch (error) {
      setLoadError(error.message || "Attendance data could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedSubject || !selectedDate) return

    let cancelled = false

    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("subject_id", selectedSubject)
        .eq("date", selectedDate)

      if (cancelled) return
      if (error) {
        toast.error("Saved attendance for this date could not be loaded: " + error.message)
        return
      }

      const saved = {}
      ;(data || []).forEach((record) => {
        saved[record.student_id] = record.status
      })

      // Nothing is marked until the teacher chooses it: an accidental save must
      // never write "absent" for the whole class.
      setCurrentAttendance(saved)
    }

    fetchAttendance()
    return () => {
      cancelled = true
    }
  }, [selectedSubject, selectedDate])

  const studentsInSubject = students.filter((student) =>
    selectedSubject ? student.subjects?.includes(selectedSubject) : false
  )

  const markedCount = studentsInSubject.filter(
    (student) => currentAttendance[student.id]
  ).length

  const handleAttendanceChange = (studentId, status) => {
    setCurrentAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    const next = {}
    studentsInSubject.forEach((student) => {
      next[student.id] = "present"
    })
    setCurrentAttendance(next)
    toast.info(`Marked ${studentsInSubject.length} students present.`)
  }

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedDate) return

    const recordsToUpsert = studentsInSubject
      .filter((student) => currentAttendance[student.id])
      .map((student) => ({
        date: selectedDate,
        subject_id: selectedSubject,
        student_id: student.id,
        status: currentAttendance[student.id],
      }))

    if (recordsToUpsert.length === 0) {
      toast.warning("Set a status for at least one student before saving.")
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from("attendance")
      .upsert(recordsToUpsert, { onConflict: ["date", "subject_id", "student_id"] })

    if (error) {
      toast.error("Attendance was not saved: " + error.message)
    } else {
      toast.success(
        `Attendance saved for ${recordsToUpsert.length} student${
          recordsToUpsert.length === 1 ? "" : "s"
        }.`
      )
    }
    setIsSaving(false)
  }

  return (
    <TeacherLayout title="Attendance">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Track Attendance</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Select Subject and Date</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <LoadingState label="Loading subjects" />
            ) : loadError ? (
              <ErrorState message={loadError} onRetry={fetchData} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="subject"
                  label="Subject"
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
                <TextField
                  id="date"
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSubject && selectedDate && !loading && !loadError && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Attendance Sheet</h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(parseISO(selectedDate), "MMMM d, yyyy")} -{" "}
              {subjects.find((s) => s.id === selectedSubject)?.name}
              <span className="ml-2 font-medium text-brand">
                ({studentsInSubject.length} students)
              </span>
            </p>
          </div>
          <div className="p-4">
            {studentsInSubject.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No students are enrolled in this subject"
                description="Open Students and add this subject to at least one student before taking attendance."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-canvas">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentsInSubject.map((student) => {
                        const status = currentAttendance[student.id] || ""
                        return (
                          <tr key={student.id} className="hover:bg-canvas">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
                                  {student.photo ? (
                                    <img src={student.photo} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-700">
                                      {student.full_name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {student.full_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{student.student_id}</td>
                            <td className="px-4 py-3">
                              <label htmlFor={`status-${student.id}`} className="sr-only">
                                Attendance status for {student.full_name}
                              </label>
                              <select
                                id={`status-${student.id}`}
                                className="min-h-11 w-full max-w-[12rem] rounded-md border border-gray-500 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
                                value={status}
                                onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                              >
                                <option value="">Not marked</option>
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600" aria-live="polite">
                    {markedCount} of {studentsInSubject.length} marked
                    {markedCount > 0 && markedCount < studentsInSubject.length
                      ? ` (${studentsInSubject.length - markedCount} still unmarked)`
                      : ""}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={markAllPresent}>
                      Mark all present
                    </Button>
                    <Button onClick={saveAttendance} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Attendance"}
                      <Save className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedSubject && !studentsInSubject.length && !loading && !loadError && subjects.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Choose a subject with enrolled students to open the attendance sheet.
        </p>
      )}
    </TeacherLayout>
  )
}
