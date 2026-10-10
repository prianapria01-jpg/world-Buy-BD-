import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import BrandLogo from "../../components/common/BrandLogo";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Direct check for previous Admin Gmail & Password
    const isPrimaryAdmin =
      (cleanEmail === "mdm859219@gmail.com" || cleanEmail === "admin" || cleanEmail === "admin@worldbuybd.com" || cleanEmail === "mdm859219") &&
      (cleanPassword === "@11489521@" || cleanPassword === "11489521" || cleanPassword === "admin" || cleanPassword === "admin123");

    const isRadowanAdmin =
      (cleanEmail === "radowan121537@gmail.com" || cleanEmail === "radowan") &&
      (cleanPassword === "1215375123" || cleanPassword === "121537" || cleanPassword === "@11489521@" || cleanPassword === "11489521");

    if (isPrimaryAdmin || isRadowanAdmin) {
      const resolvedEmail = cleanEmail.includes("@") ? cleanEmail : "mdm859219@gmail.com";
      localStorage.setItem("admin_user", JSON.stringify({ role: "admin", name: "Super Admin", email: resolvedEmail }));
      navigate("/admin");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.role === "admin") {
          localStorage.setItem("admin_user", JSON.stringify(data.data || { role: "admin", name: "Super Admin", email: cleanEmail }));
          navigate("/admin");
        } else {
          localStorage.setItem("admin_user", JSON.stringify(data.data));
          navigate("/subadmin/orders");
        }
      } else {
        setError(data.error || "Incorrect email or password. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <BrandLogo size="lg" showTagline={true} />
        <p className="mt-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
          Admin Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-gray-200">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address or Username
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full pl-10 pr-3 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none transition"
                  placeholder="Enter email or username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Admin</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
