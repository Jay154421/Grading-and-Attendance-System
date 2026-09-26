import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../ui/toastApi";
import Button from "../ui/Button";
import { TextField } from "../ui/Field";
import LoginScene from "./login-scene";

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "login", label: "Login" },
    { id: "register", label: "Register (Teachers Only)" },
  ];

  const handleTabKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim(),
        password: loginData.password,
      });
      if (authError) throw authError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User data not available");

      const role = user.user_metadata?.role || "teacher";
      window.location.href =
        role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    } catch (err) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email.trim(),
        password: registerData.password,
        options: { data: { role: "teacher" } },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.auth.signInWithPassword({
          email: registerData.email.trim(),
          password: registerData.password,
        });
      }

      toast.success("Registration successful. You can now log in.");
      setActiveTab("login");
      setLoginData({ email: registerData.email, password: "" });
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="relative hidden w-1/2 flex-col overflow-hidden border-r border-brand/15 bg-brand/10 px-12 pt-14 lg:flex xl:px-16 xl:pt-16">
        <img
          src="/logo-lockup.png"
          alt="EduCheck Attendance &amp; Grading System"
          width={326}
          height={256}
          className="relative z-10 h-40 w-auto object-contain xl:h-48"
        />
        <LoginScene className="pointer-events-none absolute -bottom-6 -right-8 z-0 w-[105%] max-w-[640px]" />
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="flex justify-center border-b border-gray-200 px-8 pt-8 pb-6 lg:hidden">
              <img
                src="/logo-lockup.png"
                alt="EduCheck Attendance &amp; Grading System"
                width={326}
                height={256}
                className="h-28 object-contain"
              />
            </div>
            <div className="flex lg:pt-4" role="tablist" aria-label="Account access">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onKeyDown={handleTabKeyDown}
                  className={`flex-1 min-h-11 px-2 text-center text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                    activeTab === tab.id
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              <form
                id="panel-login"
                role="tabpanel"
                aria-labelledby="tab-login"
                hidden={activeTab !== "login"}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Enter your credentials to access your account
                  </p>
                </div>
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
                <TextField
                  id="password"
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <form
                id="panel-register"
                role="tabpanel"
                aria-labelledby="tab-register"
                hidden={activeTab !== "register"}
                onSubmit={handleRegister}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Teacher Registration
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Create a new teacher account
                  </p>
                </div>
                <TextField
                  id="reg-email"
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                />
                <TextField
                  id="reg-password"
                  label="Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                />
                <TextField
                  id="reg-confirm-password"
                  label="Confirm Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  error={
                    registerData.confirmPassword &&
                    registerData.password !== registerData.confirmPassword
                      ? "Passwords do not match"
                      : undefined
                  }
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-600">
                  Note: Student registration is only available through the teacher portal
                  after login.
                </p>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Teacher Account"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
