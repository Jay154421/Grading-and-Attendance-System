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
import { toast } from "../ui/toastApi";
import Sidebar from "./Sidebar";
import LoadingScreen from "./LoadingScreen";

const NAV_ITEMS = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/teacher/subjects", label: "Subjects", icon: FiBook },
  { to: "/teacher/students", label: "Students", icon: FiUsers },
  { to: "/teacher/attendance", label: "Attendance", icon: FiCalendar },
  { to: "/teacher/grades", label: "Grades", icon: FiAward },
  { to: "/teacher/reports", label: "Reports", icon: FiFileText },
];

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      toast.error("You were not signed out: " + (error.message || "unknown error"));
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return <LoadingScreen label="Loading session" />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-red-600 focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Sidebar
        portal="Teacher"
        username={user?.username || "Teacher"}
        items={NAV_ITEMS}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
            <button
              type="button"
              className="mr-1 flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 md:hidden"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX size={24} aria-hidden="true" /> : <FiMenu size={24} aria-hidden="true" />}
            </button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="md:hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center rounded-lg border border-red-600 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <FiLogOut className="mr-1" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}