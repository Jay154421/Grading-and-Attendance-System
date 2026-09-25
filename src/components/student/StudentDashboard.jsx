import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../layout/student-layout";
import { BookOpen, ClipboardCheck, FileText, ArrowRight, UserCog } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../ui/Button";
import { ErrorState } from "../ui/States";

const QUICK_LINKS = [
  { to: "/student/attendance", label: "View Attendance", icon: ClipboardCheck },
  { to: "/student/grades", label: "View Grades", icon: FileText },
  { to: "/student/profile", label: "Update Profile", icon: UserCog },
];

export default function StudentDashboard() {
  const [stats, setStats] = useState({ subjects: 0, attendanceRecords: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

      let enrolledSubjects = 0;
      if (studentData.subjects) {
        if (typeof studentData.subjects === "string") {
          try {
            enrolledSubjects = JSON.parse(studentData.subjects).length;
          } catch {
            enrolledSubjects = 1;
          }
        } else if (Array.isArray(studentData.subjects)) {
          enrolledSubjects = studentData.subjects.length;
        } else {
          enrolledSubjects = 1;
        }
      }

      const { count: attendanceCount, error: attendanceError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentData.id);

      if (attendanceError) throw attendanceError;

      setStats({
        subjects: enrolledSubjects,
        attendanceRecords: attendanceCount || 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Mount-only fetch: the retry button calls this same function.
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    { label: "Enrolled Subjects", value: stats.subjects, icon: BookOpen },
    { label: "Attendance Records", value: stats.attendanceRecords, icon: ClipboardCheck },
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your enrolment and attendance totals, with shortcuts to your records.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
            >
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
          </div>
          <nav aria-label="Quick links" className="p-4">
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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

      {!error && !loading && (
        <div className="mt-6 flex justify-end">
          <Button variant="quiet" onClick={fetchData}>
            Refresh
          </Button>
        </div>
      )}
    </StudentLayout>
  );
}
