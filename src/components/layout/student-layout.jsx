import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiHome, 
  FiCalendar, 
  FiAward, 
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX 
} from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";

export default function StudentLayout({ children, title }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          navigate("/");
          return;
        }

        // Get the user data from auth and users table
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          navigate("/");
          return;
        }

        // Check role from user_metadata or users table
        let userRole = authUser.user_metadata?.role;
        
        // If not in metadata, check users table
        if (!userRole) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();

          if (!userError && userData) {
            userRole = userData.role;
          }
        }

        // Verify student role
        if (userRole !== "student") {
          navigate("/");
          return;
        }

        // Get additional student data
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        setUser({
          ...authUser,
          ...studentData,
          username: studentData?.student_id || authUser.email
        });

      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-red-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-red-800 text-white border-r">
        <div className="p-4 border-b border-red-700">
          <h2 className="text-xl font-bold">Student Portal</h2>
          <p className="text-sm text-red-200">Welcome, {user?.username || "Student"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/student/dashboard" className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors">
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </a>
          <a href="/student/attendance" className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors">
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </a>
          <a href="/student/grades" className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors">
            <FiAward className="mr-3" />
            <span>Grades</span>
          </a>
          <a href="/student/profile" className="flex items-center p-2 rounded-lg hover:bg-red-700 transition-colors">
            <FiUser className="mr-3" />
            <span>Profile</span>
          </a>
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
            <button className="md:hidden mr-2 text-red-600" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {user?.photo && (
              <img 
                src={user.photo} 
                alt="Profile" 
                className="h-8 w-8 rounded-full object-cover mr-2"
              />
            )}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="p-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center"
              >
                <FiLogOut className="mr-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-sm">
            <nav className="p-4 space-y-2">
              <a href="/student/dashboard" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors">
                <FiHome className="mr-3" />
                <span>Dashboard</span>
              </a>
              <a href="/student/attendance" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors">
                <FiCalendar className="mr-3" />
                <span>Attendance</span>
              </a>
              <a href="/student/grades" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors">
                <FiAward className="mr-3" />
                <span>Grades</span>
              </a>
              <a href="/student/profile" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors">
                <FiUser className="mr-3" />
                <span>Profile</span>
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