import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Login from "./components/auth/login-form";
import StudentAttendance from "./components/student/AttendanceRecord";
import StudentDashboard from "./components/student/StudentDashboard";
import StudentGrades from "./components/student/StudentGradesPage";
import StudentProfile from "./components/student/StudentProfilePage";

import AttendanceManage from "./components/teacher/AttendancePage";
import GradesManage from "./components/teacher/GradesPage";
import Report from "./components/teacher/ReportsPage";
import StudentManage from "./components/teacher/StudentsPage";
import TeacherSubject from "./components/teacher/SubjectsPage";
import TeacherDashboard from "./components/teacher/TeacherDashboard";

import Toaster from "./components/ui/Toast";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-600">
        The address you opened does not match any screen in this app.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      >
        Go to login
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/grades" element={<StudentGrades />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/subjects" element={<TeacherSubject />} />
        <Route path="/teacher/students" element={<StudentManage />} />
        <Route path="/teacher/attendance" element={<AttendanceManage />} />
        <Route path="/teacher/grades" element={<GradesManage />} />
        <Route path="/teacher/reports" element={<Report />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
