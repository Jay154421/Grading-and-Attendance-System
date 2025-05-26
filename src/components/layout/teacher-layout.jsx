import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiBook,
  FiUsers,
  FiCalendar,
  FiAward,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function TeacherLayout({ children, title }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/");
        return;
      }

      // Force refresh the session if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      setUser({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        username: user.user_metadata?.username || user.email.split("@")[0],
      });
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      } else if (session?.user) {
        if (session.user.user_metadata?.role === "teacher") {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role,
            username: session.user.user_metadata?.username || session.user.email.split("@")[0],
          });
        } 
      }
    });

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return null; // or a loading spinner
  }

  // Helper function to handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-red-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-red-800 text-white border-r">
        <div className="p-4 border-b border-red-700">
          <h2 className="text-xl font-bold">Teacher Portal</h2>
          <p className="text-sm text-red-200">
            Welcome, {user?.username || "Teacher"}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleNavigation("/teacher/dashboard")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/teacher/subjects")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiBook className="mr-3" />
            <span>Subjects</span>
          </button>
          <button
            onClick={() => handleNavigation("/teacher/students")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiUsers className="mr-3" />
            <span>Students</span>
          </button>
          <button
            onClick={() => handleNavigation("/teacher/attendance")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => handleNavigation("/teacher/grades")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiAward className="mr-3" />
            <span>Grades</span>
          </button>
          <button
            onClick={() => handleNavigation("/teacher/reports")}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            <FiFileText className="mr-3" />
            <span>Reports</span>
          </button>
        </nav>
        <div className="p-4 border-t border-red-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 border border-gray-300 rounded-md hover:bg-red-700 transition-colors"
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
              <button
                onClick={() => handleNavigation("/teacher/dashboard")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiHome className="mr-3" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/subjects")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiBook className="mr-3" />
                <span>Subjects</span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/students")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiUsers className="mr-3" />
                <span>Students</span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/attendance")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiCalendar className="mr-3" />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/grades")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiAward className="mr-3" />
                <span>Grades</span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/reports")}
                className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FiFileText className="mr-3" />
                <span>Reports</span>
              </button>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}