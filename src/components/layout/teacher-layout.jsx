
import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiBook,
  FiUsers,
  FiCalendar,
  FiAward,
  FiFileText,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";

export default function TeacherLayout({ children, title }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = "/";
        return;
      }

      if (user.user_metadata?.role !== "teacher") {
        window.location.href = "/";
        return;
      }

      setUser({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        username: user.user_metadata?.username || user.email.split('@')[0]
      });
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex h-screen bg-red-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-red-800 text-white border-r">
        <div className="p-4 border-b border-red-700">
          <h2 className="text-xl font-bold">Teacher Portal</h2>
          <p className="text-sm text-red-200">Welcome, {user.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/teacher/dashboard"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </a>
          <a
            href="/teacher/subjects"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiBook className="mr-3" />
            <span>Subjects</span>
          </a>
          <a
            href="/teacher/students"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiUsers className="mr-3" />
            <span>Students</span>
          </a>
          <a
            href="/teacher/attendance"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </a>
          <a
            href="/teacher/grades"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiAward className="mr-3" />
            <span>Grades</span>
          </a>
          <a
            href="/teacher/reports"
            className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiFileText className="mr-3" />
            <span>Reports</span>
          </a>
        </nav>
        <div className="p-4 border-t border-red-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 border border-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            <FiLogOut className="mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
            <button
              className="md:hidden mr-2 text-red-600"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="md:hidden">
            <button
              onClick={handleLogout}
              className="p-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center"
            >
              <FiLogOut className="mr-1" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-sm">
            <nav className="p-4 space-y-2">
              <a
                href="/teacher/dashboard"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiHome className="mr-3" />
                <span>Dashboard</span>
              </a>
              <a
                href="/teacher/subjects"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiBook className="mr-3" />
                <span>Subjects</span>
              </a>
              <a
                href="/teacher/students"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiUsers className="mr-3" />
                <span>Students</span>
              </a>
              <a
                href="/teacher/attendance"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiCalendar className="mr-3" />
                <span>Attendance</span>
              </a>
              <a
                href="/teacher/grades"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiAward className="mr-3" />
                <span>Grades</span>
              </a>
              <a
                href="/teacher/reports"
                className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiFileText className="mr-3" />
                <span>Reports</span>
              </a>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}