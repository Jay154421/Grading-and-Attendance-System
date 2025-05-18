import React, { useState, useEffect } from "react"
import StudentLayout from "../layout/student-layout"

export default function StudentAttendancePage() {
  const [subjects, setSubjects] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [filteredAttendance, setFilteredAttendance] = useState([])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }

    const storedSubjects = JSON.parse(localStorage.getItem("subjects") || "[]")
    const storedAttendance = JSON.parse(localStorage.getItem("attendance") || "[]")

    setSubjects(storedSubjects)
    setAttendanceRecords(storedAttendance)
  }, [])

  useEffect(() => {
    if (currentUser && selectedSubject) {
      const filtered = attendanceRecords.filter(
        (record) => record.studentId === currentUser.id && record.subjectId === selectedSubject,
      )
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setFilteredAttendance(filtered)
    } else if (currentUser) {
      const filtered = attendanceRecords.filter((record) => record.studentId === currentUser.id)
      setFilteredAttendance(filtered)
    }
  }, [currentUser, selectedSubject, attendanceRecords])

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    switch (status) {
      case "present":
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Present</span>
      case "absent":
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Absent</span>
      case "late":
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Late</span>
      case "excused":
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Excused</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>
    }
  }

  return (
    <StudentLayout title="Attendance">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-red-800">My Attendance</h2>
        <div className="border border-red-100 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800">Filter by Subject</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">All subjects</option>
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

      <div className="border border-red-100 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-red-100 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800">Attendance Records</h3>
        </div>
        <div className="p-4 bg-white">
          {filteredAttendance.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record) => {
                    const subject = subjects.find((s) => s.id === record.subjectId)
                    return (
                      <tr key={record.id} className="hover:bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject ? `${subject.code} - ${subject.name}` : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getStatusBadge(record.status)}
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
    </StudentLayout>
  )
}