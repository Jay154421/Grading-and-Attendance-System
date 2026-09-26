import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import TeacherLayout from "../layout/teacher-layout"
import { BookOpen, Users, ClipboardCheck, GraduationCap, FileText, ArrowRight, RefreshCw } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import Button from "../ui/Button"
import { ErrorState } from "../ui/States"

const QUICK_LINKS = [
  { to: "/teacher/subjects", label: "Manage Subjects", icon: BookOpen },
  { to: "/teacher/students", label: "Manage Students", icon: Users },
  { to: "/teacher/attendance", label: "Track Attendance", icon: ClipboardCheck },
  { to: "/teacher/grades", label: "Record Grades", icon: GraduationCap },
  { to: "/teacher/reports", label: "Generate Reports", icon: FileText },
]

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ subjects: 0, students: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [subjectsResult, studentsResult] = await Promise.all([
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
      ])
      if (subjectsResult.error) throw subjectsResult.error
      if (studentsResult.error) throw studentsResult.error

      setStats({
        subjects: subjectsResult.count || 0,
        students: studentsResult.count || 0,
      })
    } catch (error) {
      setLoadError(error.message || "Dashboard counts could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    { label: "Total Subjects", value: stats.subjects, icon: BookOpen },
    { label: "Total Students", value: stats.students, icon: Users },
  ]

  return (
    <TeacherLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Everything you teach at a glance, plus shortcuts to the tasks you run most.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ErrorState message={loadError} onRetry={fetchStats} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {cards.map((card) => (
            <div key={card.label} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-gray-700">{card.label}</h3>
                <card.icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
              <div
                className="text-2xl font-bold text-gray-900"
                role="status"
                aria-live="polite"
                aria-busy={loading || undefined}
              >
                {loading ? "-" : card.value}
                {loading && <span className="sr-only">Loading {card.label}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
          </div>
          <nav aria-label="Quick links" className="p-4">
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <link.icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                    <span className="flex-1">{link.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {!loadError && !loading && (
        <div className="mt-6 flex justify-end">
          <Button variant="quiet" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh counts
          </Button>
        </div>
      )}
    </TeacherLayout>
  )
}
