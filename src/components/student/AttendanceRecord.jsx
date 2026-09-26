import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/student-layout";
import { Check, X, Clock, AlertCircle, ClipboardList } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { SelectField } from "../ui/Field";
import { LoadingState, EmptyState, ErrorState } from "../ui/States";

const STATUS_CONFIG = {
  present: {
    icon: Check,
    chip: "bg-green-100 text-green-800",
    iconColor: "text-green-700",
    label: "Present",
  },
  absent: {
    icon: X,
    chip: "bg-red-100 text-red-800",
    iconColor: "text-red-700",
    label: "Absent",
  },
  late: {
    icon: Clock,
    chip: "bg-yellow-100 text-yellow-800",
    iconColor: "text-yellow-700",
    label: "Late",
  },
  excused: {
    icon: AlertCircle,
    chip: "bg-blue-100 text-blue-800",
    iconColor: "text-blue-700",
    label: "Excused",
  },
};

const UNKNOWN_STATUS = {
  icon: AlertCircle,
  chip: "bg-gray-100 text-gray-700",
  iconColor: "text-gray-600",
  label: "Not recorded",
};

export default function StudentAttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

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
        .select("*")
        .eq("email", user.email)
        .single();

      if (studentError) throw studentError;
      if (!studentData) throw new Error("No student record found for this account.");

      let enrolledSubjectIds = [];
      if (studentData.subjects) {
        try {
          enrolledSubjectIds = Array.isArray(studentData.subjects)
            ? studentData.subjects
            : JSON.parse(studentData.subjects);
        } catch {
          enrolledSubjectIds = [];
        }
      }

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .in("id", enrolledSubjectIds);

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);
      setEnrolledSubjects(subjectsData || []);

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentData.id)
        .in("subject_id", enrolledSubjectIds);

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendanceData || []);
    } catch (error) {
      setLoadError(error.message || "Your attendance records could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  // Mount-only fetch: the retry button calls this same function.
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filtered = selectedSubject
      ? attendanceRecords.filter((record) => record.subject_id === selectedSubject)
      : attendanceRecords;

    setFilteredAttendance(
      [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }, [selectedSubject, attendanceRecords]);

  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || UNKNOWN_STATUS;
    const Glyph = config.icon;
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${config.chip}`}>
        <Glyph className={`h-4 w-4 ${config.iconColor}`} aria-hidden="true" />
        {config.label}
      </span>
    );
  };

  return (
    <StudentLayout title="Attendance">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">My Attendance</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-canvas">
            <h3 className="text-lg font-semibold text-gray-900">Filter by Subject</h3>
          </div>
          <div className="p-4 bg-white">
            <SelectField
              id="subject"
              label="Subject"
              hint="Leave as All subjects to see your full history."
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All subjects</option>
              {enrolledSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-canvas">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
          <p className="mt-1 text-sm text-gray-600" aria-live="polite">
            {loading
              ? "Loading records"
              : `${filteredAttendance.length} record${filteredAttendance.length === 1 ? "" : "s"}${
                  selectedSubject ? " in this subject" : ""
                }`}
          </p>
        </div>
        <div className="p-4 bg-white">
          {loading ? (
            <LoadingState label="Loading attendance data" />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={fetchData} />
          ) : filteredAttendance.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No attendance records yet"
              description="Nothing has been recorded for this subject yet. Check back after your next class."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-canvas">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record) => {
                    const subject = subjects.find((s) => s.id === record.subject_id);
                    return (
                      <tr key={record.id} className="hover:bg-canvas">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject ? `${subject.code} - ${subject.name}` : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
