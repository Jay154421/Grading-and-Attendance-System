import React, { useEffect, useState } from "react"
import StudentLayout from "../layout/student-layout"
import { BookOpen, ClipboardCheck, GraduationCap } from "lucide-react"

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    attendanceRecords: 0,
    gradeRecords: 0,
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      setUser(userData)

      const subjects = JSON.parse(localStorage.getItem("subjects") || "[]")
      const attendance = JSON.parse(localStorage.getItem("attendance") || "[]").filter(
        (a) => a.studentId === userData.id,
      )
      const grades = JSON.parse(localStorage.getItem("grades") || "[]").filter((g) => g.studentId === userData.id)

      setStats({
        subjects: subjects.length,
        attendanceRecords: attendance.length,
        gradeRecords: grades.length,
      })
    }
  }, [])

  if (!user) return null

  return (
    <StudentLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Enrolled Subjects</h3>
            <BookOpen className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{stats.subjects}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Attendance Records</h3>
            <ClipboardCheck className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{stats.attendanceRecords}</div>
        </div>
      
      </div>

      <div className="mt-8 grid gap-4">
        

        <div className="bg-white rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-red-100">
            <h3 className="text-lg font-bold text-red-800">Quick Links</h3>
          </div>
          <div className="p-4 space-y-2">
            <a href="/student/attendance" className="block p-2 text-sm rounded-lg hover:bg-red-50 transition-colors">
              View Attendance
            </a>
            <a href="/student/grades" className="block p-2 text-sm rounded-lg hover:bg-red-50 transition-colors">
              View Grades
            </a>
            <a href="/student/profile" className="block p-2 text-sm rounded-lg hover:bg-red-50 transition-colors">
              Update Profile
            </a>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}