import { useState, useEffect, useRef } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { FileDown } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "../ui/toastApi"
import Button from "../ui/Button"
import { SelectField } from "../ui/Field"
import { LoadingState, ErrorState } from "../ui/States"

const ACCENT = [220, 38, 38] // #dc2626 - 4.83:1 with white, the only accent in DESIGN.md

export default function ReportsPage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [gradeRecords, setGradeRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activeTab, setActiveTab] = useState("attendance")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const tabRefs = useRef([])

  const fetchData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [subjectsResult, studentsResult, attendanceResult, gradesResult] = await Promise.all([
        supabase.from("subjects").select("*"),
        supabase.from("students").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("grades").select("*"),
      ])
      if (subjectsResult.error) throw subjectsResult.error
      if (studentsResult.error) throw studentsResult.error
      if (attendanceResult.error) throw attendanceResult.error
      if (gradesResult.error) throw gradesResult.error
      setSubjects(subjectsResult.data ?? [])
      setStudents(studentsResult.data ?? [])
      setAttendanceRecords(attendanceResult.data ?? [])
      setGradeRecords(gradesResult.data ?? [])
    } catch (error) {
      setLoadError(error.message || "Report data could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const reportStudents = students.filter((student) =>
    selectedSubject ? student.subjects?.includes(selectedSubject) : false
  )

  const calculateCumulativeGrades = (studentId) => {
    const raw = { prelim: null, midterm: null, semifinal: null, final: null }

    gradeRecords
      .filter(
        (record) =>
          record.subject_id === selectedSubject && record.student_id === studentId
      )
      .forEach((record) => {
        if (Object.prototype.hasOwnProperty.call(raw, record.term)) raw[record.term] = record.grade
      })

    // Average only the terms that exist on record. A missing term is skipped,
    // never counted as zero.
    const entered = [raw.prelim, raw.midterm, raw.semifinal, raw.final].filter(
      (value) => value !== null && value !== undefined
    )
    const averageUpTo = (count) =>
      count === 0
        ? null
        : entered.slice(0, count).reduce((sum, value) => sum + value, 0) / count

    const hasFinal = raw.final !== null && raw.final !== undefined

    return {
      raw,
      cumulative: {
        prelim: averageUpTo(Math.min(entered.length, 1)),
        midterm: averageUpTo(Math.min(entered.length, 2)),
        semifinal: averageUpTo(Math.min(entered.length, 3)),
        final: averageUpTo(Math.min(entered.length, 4)),
      },
      hasFinal,
    }
  }

  const statusFor = (result) =>
    !result.hasFinal
      ? "Incomplete"
      : result.cumulative.final <= 3.0
        ? "Passed"
        : "Failed"

  const csvCell = (value) => {
    const text = value === null || value === undefined ? "" : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${filename} downloaded.`)
  }

  const guard = () => {
    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject || reportStudents.length === 0) {
      toast.warning("Select a subject that has enrolled students first.")
      return null
    }
    return subject
  }

  const exportAttendanceCSV = () => {
    const subject = guard()
    if (!subject) return

    const relevantAttendance = attendanceRecords.filter(
      (record) => record.subject_id === selectedSubject
    )
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) acc[record.date] = {}
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    const dates = Object.keys(attendanceByDate).sort()
    let csv = "Student ID,Student Name"
    dates.forEach((date) => {
      csv += `,${date}`
    })
    csv += "\n"

    reportStudents.forEach((student) => {
      csv += `${csvCell(student.student_id)},${csvCell(student.full_name)}`
      dates.forEach((date) => {
        csv += `,${csvCell(attendanceByDate[date][student.id] || "N/A")}`
      })
      csv += "\n"
    })

    download(csv, `${subject.code}_attendance.csv`, "text/csv")
  }

  const exportGradesCSV = () => {
    const subject = guard()
    if (!subject) return

    let csv =
      "Student ID,Student Name,Prelim Raw,Midterm Raw,Semi-Final Raw,Final Raw,Prelim Cumulative,Midterm Cumulative,Semi-Final Cumulative,Final Cumulative,Status\n"

    reportStudents.forEach((student) => {
      const grades = calculateCumulativeGrades(student.id)
      const fmt = (value) =>
        value === null || value === undefined ? "" : value.toFixed(2)
      csv += `${csvCell(student.student_id)},${csvCell(student.full_name)},`
      csv += `${fmt(grades.raw.prelim)},${fmt(grades.raw.midterm)},${fmt(grades.raw.semifinal)},${fmt(grades.raw.final)},`
      csv += `${fmt(grades.cumulative.prelim)},${fmt(grades.cumulative.midterm)},${fmt(grades.cumulative.semifinal)},${fmt(grades.cumulative.final)},`
      csv += `${statusFor(grades)}\n`
    })

    download(csv, `${subject.code}_grades.csv`, "text/csv")
  }

  const exportAttendancePDF = () => {
    const subject = guard()
    if (!subject) return

    const relevantAttendance = attendanceRecords.filter(
      (record) => record.subject_id === selectedSubject
    )
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) acc[record.date] = {}
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    const dates = Object.keys(attendanceByDate).sort()
    const headers = ["Student ID", "Student Name", ...dates]
    const data = reportStudents.map((student) => {
      const row = [student.student_id, student.full_name]
      dates.forEach((date) => {
        row.push(attendanceByDate[date][student.id] || "N/A")
      })
      return row
    })

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`${subject.code} - ${subject.name} Attendance Report`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { cellPadding: 3, fontSize: 10, valign: "middle" },
      headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: "auto" } },
      margin: { top: 40 },
    })

    const filename = `${subject.code}_attendance.pdf`
    doc.save(filename)
    toast.success(`${filename} downloaded.`)
  }

  const exportGradesPDF = () => {
    const subject = guard()
    if (!subject) return

    const headers = [
      "Student ID",
      "Student Name",
      "Prelim",
      "Midterm",
      "Semi-Final",
      "Final",
      "Status",
    ]

    const data = reportStudents.map((student) => {
      const grades = calculateCumulativeGrades(student.id)
      const fmt = (value) =>
        value === null || value === undefined ? "-" : value.toFixed(2)
      return [
        student.student_id,
        student.full_name,
        fmt(grades.cumulative.prelim),
        fmt(grades.cumulative.midterm),
        fmt(grades.cumulative.semifinal),
        fmt(grades.cumulative.final),
        statusFor(grades),
      ]
    })

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`${subject.code} - ${subject.name} Grade Report`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    doc.text(`Passing Grade: 3.0 (lower is better)`, 14, 40)

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 50,
      styles: { cellPadding: 3, fontSize: 10, valign: "middle" },
      headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: "auto" } },
      margin: { top: 50 },
    })

    const filename = `${subject.code}_grades.pdf`
    doc.save(filename)
    toast.success(`${filename} downloaded.`)
  }

  const TABS = [
    { id: "attendance", label: "Attendance Reports" },
    { id: "grades", label: "Grade Reports" },
  ]

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

  return (
    <TeacherLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Generate Reports</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Select Subject</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <LoadingState label="Loading reports" />
            ) : loadError ? (
              <ErrorState message={loadError} onRetry={fetchData} />
            ) : (
              <SelectField
                id="subject"
                label="Subject"
                hint="Reports cover only the students enrolled in this subject."
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
            )}
          </div>
        </div>
      </div>

      {selectedSubject && !loading && !loadError && (
        <div>
          <div className="mb-4">
            <div className="flex border-b border-gray-200" role="tablist" aria-label="Report types">
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  type="button"
                  role="tab"
                  id={`report-tab-${tab.id}`}
                  data-tab={tab.id}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`report-panel-${tab.id}`}
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

          {activeTab === "attendance" && (
            <div
              role="tabpanel"
              id="report-panel-attendance"
              aria-labelledby="report-tab-attendance"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Attendance Reports</h3>
              </div>
              <div className="p-4">
                <p className="mb-4 text-gray-600">
                  Export attendance records for the selected subject. The report includes
                  attendance status (Present, Absent, Late, Excused) for each student.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={exportAttendanceCSV}>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Export as CSV
                  </Button>
                  <Button variant="secondary" onClick={exportAttendancePDF}>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grades" && (
            <div
              role="tabpanel"
              id="report-panel-grades"
              aria-labelledby="report-tab-grades"
              tabIndex={0}
              className="bg-white rounded-lg border border-gray-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Grade Reports</h3>
              </div>
              <div className="p-4">
                <p className="mb-4 text-gray-600">
                  Export grade records for the selected subject. The report includes both raw
                  and cumulative grades for each term, as well as the final status
                  (Passed/Failed). Students without a final grade are marked
                  <span className="font-medium text-gray-900"> Incomplete</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={exportGradesCSV}>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Export as CSV
                  </Button>
                  <Button variant="secondary" onClick={exportGradesPDF}>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </TeacherLayout>
  )
}
