
import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { FileDown } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export default function ReportsPage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [gradeRecords, setGradeRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activeTab, setActiveTab] = useState("attendance")

  useEffect(() => {
    const fetchData = async () => {
      const { data: subjectsData } = await supabase.from('subjects').select('*')
      const { data: studentsData } = await supabase.from('students').select('*')
      const { data: attendanceData } = await supabase.from('attendance').select('*')
      const { data: gradesData } = await supabase.from('grades').select('*')

      if (subjectsData) setSubjects(subjectsData)
      if (studentsData) setStudents(studentsData)
      if (attendanceData) setAttendanceRecords(attendanceData)
      if (gradesData) setGradeRecords(gradesData)
    }
    fetchData()
  }, [])

  const calculateCumulativeGrades = (studentId) => {
    const studentGrades = gradeRecords
      .filter((record) => record.subject_id === selectedSubject && record.student_id === studentId)
      .reduce(
        (acc, record) => {
          acc[record.term] = record.grade
          return acc
        },
        { prelim: 0, midterm: 0, semifinal: 0, final: 0 },
      )

    const prelimGrade = studentGrades.prelim
    const midtermGrade = (prelimGrade + studentGrades.midterm) / 2
    const semifinalGrade = (midtermGrade + studentGrades.semifinal) / 2
    const finalGrade = (semifinalGrade + studentGrades.final) / 2

    return {
      raw: studentGrades,
      cumulative: {
        prelim: prelimGrade,
        midterm: midtermGrade,
        semifinal: semifinalGrade,
        final: finalGrade,
      },
    }
  }

  const exportAttendanceCSV = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    const relevantAttendance = attendanceRecords.filter((record) => record.subject_id === selectedSubject)
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = {}
      }
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    let csv = "Student ID,Student Name"
    const dates = Object.keys(attendanceByDate).sort()
    dates.forEach((date) => {
      csv += `,${date}`
    })
    csv += "\n"

    students.forEach((student) => {
      csv += `${student.student_id},"${student.full_name}"`
      dates.forEach((date) => {
        const status = attendanceByDate[date][student.id] || "N/A"
        csv += `,${status}`
      })
      csv += "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${subject.code}_attendance.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportGradesCSV = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    let csv =
      "Student ID,Student Name,Prelim Raw,Midterm Raw,Semi-Final Raw,Final Raw,Prelim Cumulative,Midterm Cumulative,Semi-Final Cumulative,Final Cumulative,Status\n"

    students.forEach((student) => {
      const grades = calculateCumulativeGrades(student.id)
      const finalGrade = grades.cumulative.final
      const status = finalGrade <= 3.0 ? "Passed" : "Failed"

      csv += `${student.student_id},"${student.full_name}",`
      csv += `${grades.raw.prelim},${grades.raw.midterm},${grades.raw.semifinal},${grades.raw.final},`
      csv += `${grades.cumulative.prelim.toFixed(2)},${grades.cumulative.midterm.toFixed(2)},${grades.cumulative.semifinal.toFixed(2)},${grades.cumulative.final.toFixed(2)},`
      csv += `${status}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${subject.code}_grades.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAttendancePDF = () => {
    if (!selectedSubject) return
    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    const relevantAttendance = attendanceRecords.filter((record) => record.subject_id === selectedSubject)
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = {}
      }
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    const dates = Object.keys(attendanceByDate).sort()
    
    // Prepare data for the table
    const headers = ["Student ID", "Student Name", ...dates]
    const data = students.map(student => {
      const row = [student.student_id, student.full_name]
      dates.forEach(date => {
        const status = attendanceByDate[date][student.id] || "N/A"
        row.push(status)
      })
      return row
    })

    // Create PDF
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.text(`${subject.code} - ${subject.name} Attendance Report`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    
    // Table - use the imported autoTable function directly
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: {
        cellPadding: 3,
        fontSize: 10,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' }
      },
      margin: { top: 40 }
    })

    doc.save(`${subject.code}_attendance.pdf`)
  }

  const exportGradesPDF = () => {
    if (!selectedSubject) return
    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    // Prepare data for the table
    const headers = [
      "Student ID",
      "Student Name",
      "Prelim",
      "Midterm",
      "Semi-Final",
      "Final",
      "Status"
    ]

    const data = students.map(student => {
      const grades = calculateCumulativeGrades(student.id)
      const finalGrade = grades.cumulative.final
      const status = finalGrade <= 3.0 ? "Passed" : "Failed"

      return [
        student.student_id,
        student.full_name,
        grades.cumulative.prelim.toFixed(2),
        grades.cumulative.midterm.toFixed(2),
        grades.cumulative.semifinal.toFixed(2),
        grades.cumulative.final.toFixed(2),
        status
      ]
    })

    // Create PDF
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.text(`${subject.code} - ${subject.name} Grade Report`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    doc.text(`Passing Grade: 3.0`, 14, 40)
    
    // Table - use the imported autoTable function directly
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 50,
      styles: {
        cellPadding: 3,
        fontSize: 10,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' }
      },
      margin: { top: 50 }
    })

    doc.save(`${subject.code}_grades.pdf`)
  }

  return (
    <TeacherLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Generate Reports</h2>
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100">
            <h3 className="text-lg font-bold">Select Subject</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium">
                Subject
              </label>
              <select
                id="subject"
                className="w-full px-3 py-2 border border-red-200 rounded-md bg-white"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedSubject && (
        <div>
          <div className="mb-4">
            <div className="flex border-b border-red-100">
              <button
                className={`py-2 px-4 ${
                  activeTab === "attendance" ? "border-b-2 border-red-600 font-medium" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance Reports
              </button>
              <button
                className={`py-2 px-4 ${
                  activeTab === "grades" ? "border-b-2 border-red-600 font-medium" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("grades")}
              >
                Grade Reports
              </button>
            </div>
          </div>

          {activeTab === "attendance" && (
            <div className="bg-white rounded-lg border border-red-100 shadow-sm">
              <div className="p-4 border-b border-red-100">
                <h3 className="text-lg font-bold">Attendance Reports</h3>
              </div>
              <div className="p-4">
                <p className="mb-4 text-gray-500">
                  Export attendance records for the selected subject. The report includes attendance status (Present,
                  Absent, Late, Excused) for each student.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    onClick={exportAttendanceCSV}
                  >
                    <FileDown className="h-4 w-4" />
                    Export as CSV
                  </button>
                  <button
                    className="flex items-center gap-2 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50"
                    onClick={exportAttendancePDF}
                  >
                    <FileDown className="h-4 w-4" />
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grades" && (
            <div className="bg-white rounded-lg border border-red-100 shadow-sm">
              <div className="p-4 border-b border-red-100">
                <h3 className="text-lg font-bold">Grade Reports</h3>
              </div>
              <div className="p-4">
                <p className="mb-4 text-gray-500">
                  Export grade records for the selected subject. The report includes both raw and cumulative grades for
                  each term, as well as the final status (Passed/Failed).
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    onClick={exportGradesCSV}
                  >
                    <FileDown className="h-4 w-4" />
                    Export as CSV
                  </button>
                  <button
                    className="flex items-center gap-2 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50"
                    onClick={exportGradesPDF}
                  >
                    <FileDown className="h-4 w-4" />
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </TeacherLayout>
  )
}