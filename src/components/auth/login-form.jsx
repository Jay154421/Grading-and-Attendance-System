import React, { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import toast, { Toaster } from 'toastr'
import 'toastr/build/toastr.min.css'

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) throw authError;

      // Get the full user data to check role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User data not available");
      }

      toast.success("Login successful! Redirecting...");
      
      // Redirect based on role
      const role = user.user_metadata?.role || "teacher";
      setTimeout(() => {
        window.location.href =
          role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
      }, 1500);
    } catch (err) {
      setError(err.message || "Invalid email or password");
      toast.error(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            role: registerData.role,
          },
        },
      });

      if (error) throw error;

      // Auto-confirm the user (only works if email confirmations are disabled in Supabase settings)
      if (data.user) {
        await supabase.auth.signInWithPassword({
          email: registerData.email,
          password: registerData.password,
        });
      }

      toast.success("Registration successful! You can now login.");
      setError("");
      setActiveTab("login");
      setLoginData({ email: registerData.email, password: "" });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      toast.error(err.message || "Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
          <div className="flex bg-gray-50">
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "login"
                  ? "border-red-600 text-red-700 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "register"
                  ? "border-red-600 text-red-700 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("register");
                setError("");
              }}
            >
              Register (Teachers Only)
            </button>
          </div>

          <div className="p-8">
            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Enter your credentials to access your account
                  </p>
                </div>

                {error && (
                  <div className="flex items-start p-3 space-x-2 text-sm text-red-600 bg-red-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Teacher Registration
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Create your teacher account
                  </p>
                </div>

                {error && (
                  <div className="flex items-start p-3 space-x-2 text-sm text-red-600 bg-red-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum 6 characters
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      required
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <input
                  type="hidden"
                  value="teacher"
                  onChange={(e) =>
                    setRegisterData({ ...registerData, role: e.target.value })
                  }
                />

                <div className="text-xs text-gray-500 mt-2">
                  <p>
                    By registering, you agree to our Terms of Service and Privacy Policy.
                  </p>
                  <p className="mt-1">
                    Note: Student accounts can only be created by teachers after login.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Registering...
                    </>
                  ) : (
                    "Create Teacher Account"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}