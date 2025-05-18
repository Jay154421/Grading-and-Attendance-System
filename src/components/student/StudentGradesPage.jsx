import React, { useState, useEffect } from "react"
import StudentLayout from "../layout/student-layout"

export default function StudentGradesPage() {
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activeTab, setActiveTab] = useState("raw")
  const [currentUser, setCurrentUser] = useState(null)
  const [studentData, setStudentData] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const userData = JSON.parse(user)
      setCurrentUser(userData)
      
      // Get student data from students array
      const students = JSON.parse(localStorage.getItem("students") || "[]")
      const studentRecord = students.find(s => s.id === userData.id)
      setStudentData(studentRecord)
    }

    const storedSubjects = JSON.parse(localStorage.getItem("subjects") || "[]")
    const storedGrades = JSON.parse(localStorage.getItem("grades") || "[]")

    setSubjects(storedSubjects)
    setGrades(storedGrades)
  }, [])

  const getGradesBySubject = () => {
    if (!currentUser) return {}
    
    // Get all grades for this student
    const filteredGrades = grades.filter(grade => 
      grade.studentId === currentUser.id && 
      (selectedSubject === "" || grade.subjectId === selectedSubject)
    )

    // Group by subject and term
    const groupedGrades = {}
    
    filteredGrades.forEach(grade => {
      if (!groupedGrades[grade.subjectId]) {
        groupedGrades[grade.subjectId] = {
          prelim: 0,
          midterm: 0,
          semifinal: 0,
          final: 0
        }
      }
      groupedGrades[grade.subjectId][grade.term] = grade.grade
    })

    return groupedGrades
  }

  const calculateCumulativeGrades = (rawGrades) => {
    const prelimGrade = rawGrades.prelim
    const midtermGrade = (prelimGrade + rawGrades.midterm) / 2
    const semifinalGrade = (midtermGrade + rawGrades.semifinal) / 2
    const finalGrade = (semifinalGrade + rawGrades.final) / 2

    return {
      prelim: prelimGrade,
      midterm: midtermGrade,
      semifinal: semifinalGrade,
      final: finalGrade,
    }
  }

  const isPassingGrade = (grade) => grade <= 3.0

  const gradesBySubject = getGradesBySubject()

  // Filter subjects that this student is enrolled in
  const enrolledSubjects = subjects.filter(subject => 
    studentData?.subjects?.includes(subject.id))

  return (
    <StudentLayout title="Grades">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-red-800">My Grades</h2>
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Filter by Subject</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All subjects</option>
                {enrolledSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex border-b border-red-100">
          <button
            className={`py-2 px-4 ${activeTab === "raw" ? "border-b-2 border-red-600 font-medium text-red-700" : "text-gray-600"}`}
            onClick={() => setActiveTab("raw")}
          >
            Raw Grades
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "cumulative" ? "border-b-2 border-red-600 font-medium text-red-700" : "text-gray-600"
            }`}
            onClick={() => setActiveTab("cumulative")}
          >
            Cumulative Grades
          </button>
        </div>
      </div>

      {activeTab === "raw" && (
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Raw Grades</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedSubject 
                ? subjects.find(s => s.id === selectedSubject)?.name 
                : "All Subjects"}
              <span className="ml-2 text-red-600">
                ({Object.keys(gradesBySubject).length} subjects)
              </span>
            </p>
          </div>
          <div className="p-4">
            {Object.keys(gradesBySubject).length === 0 ? (
              <p className="text-center py-4 text-gray-500">No grade records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="text-left p-3">Subject</th>
                      <th className="text-left p-3">Prelim</th>
                      <th className="text-left p-3">Midterm</th>
                      <th className="text-left p-3">Semi-Final</th>
                      <th className="text-left p-3">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(gradesBySubject).map(([subjectId, terms]) => {
                      const subject = subjects.find((s) => s.id === subjectId)
                      return (
                        <tr key={subjectId} className="border-b border-red-100 hover:bg-red-50">
                          <td className="p-3">{subject ? `${subject.code} - ${subject.name}` : "Unknown"}</td>
                          <td className={`p-3 ${!isPassingGrade(terms.prelim) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {terms.prelim > 0 ? terms.prelim.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassingGrade(terms.midterm) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {terms.midterm > 0 ? terms.midterm.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassingGrade(terms.semifinal) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {terms.semifinal > 0 ? terms.semifinal.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassingGrade(terms.final) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {terms.final > 0 ? terms.final.toFixed(2) : "-"}
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

      {activeTab === "cumulative" && (
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Cumulative Grades</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedSubject 
                ? subjects.find(s => s.id === selectedSubject)?.name 
                : "All Subjects"}
              <span className="ml-2 text-red-600">
                ({Object.keys(gradesBySubject).length} subjects)
              </span>
            </p>
          </div>
          <div className="p-4">
            {Object.keys(gradesBySubject).length === 0 ? (
              <p className="text-center py-4 text-gray-500">No grade records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="text-left p-3">Subject</th>
                      <th className="text-left p-3">Prelim</th>
                      <th className="text-left p-3">Midterm</th>
                      <th className="text-left p-3">Semi-Final</th>
                      <th className="text-left p-3">Final</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(gradesBySubject).map(([subjectId, rawGrades]) => {
                      const subject = subjects.find((s) => s.id === subjectId)
                      const cumulativeGrades = calculateCumulativeGrades(rawGrades)
                      const finalGrade = cumulativeGrades.final
                      const isPassing = isPassingGrade(finalGrade)

                      return (
                        <tr key={subjectId} className="border-b border-red-100 hover:bg-red-50">
                          <td className="p-3">{subject ? `${subject.code} - ${subject.name}` : "Unknown"}</td>
                          <td className={`p-3 ${!isPassingGrade(cumulativeGrades.prelim) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {cumulativeGrades.prelim > 0 ? cumulativeGrades.prelim.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassingGrade(cumulativeGrades.midterm) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {cumulativeGrades.midterm > 0 ? cumulativeGrades.midterm.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassingGrade(cumulativeGrades.semifinal) ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {cumulativeGrades.semifinal > 0 ? cumulativeGrades.semifinal.toFixed(2) : "-"}
                          </td>
                          <td className={`p-3 ${!isPassing ? "text-red-600 font-medium" : "text-green-600"}`}>
                            {finalGrade > 0 ? finalGrade.toFixed(2) : "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`${
                                isPassing ? "bg-green-500" : "bg-red-500"
                              } text-white text-xs px-2 py-1 rounded-full`}
                            >
                              {finalGrade > 0 ? (isPassing ? "Passed" : "Failed") : "Pending"}
                            </span>
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
    </StudentLayout>
  )
}