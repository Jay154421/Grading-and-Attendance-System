// pages/teacher/dashboard.jsx
import React, { useEffect, useState } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { BookOpen, Users, ClipboardCheck, GraduationCap } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"


export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      
      const { count: subjectsCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      setStats({
        subjects: subjectsCount || 0,
        students: studentsCount || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <TeacherLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Subjects</h3>
            <BookOpen className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? "--" : stats.subjects}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Students</h3>
            <Users className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? "--" : stats.students}</div>
        </div>    
      </div>

      <div className="mt-8 grid gap-4">
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100">
            <h3 className="text-lg font-bold">Quick Links</h3>
          </div>
          <div className="p-4 space-y-2">
            <a href="/teacher/subjects" className="block p-2 text-sm rounded-lg hover:bg-red-50">
              Manage Subjects
            </a>
            <a href="/teacher/students" className="block p-2 text-sm rounded-lg hover:bg-red-50">
              Manage Students
            </a>
            <a href="/teacher/attendance" className="block p-2 text-sm rounded-lg hover:bg-red-50">
              Track Attendance
            </a>
            <a href="/teacher/grades" className="block p-2 text-sm rounded-lg hover:bg-red-50">
              Record Grades
            </a>
            <a href="/teacher/reports" className="block p-2 text-sm rounded-lg hover:bg-red-50">
              Generate Reports
            </a>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}