import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Phone,
  Lock,
  User as UserIcon,
  Mail,
  MapPin,
  Building,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut
} from "lucide-react";

export default function CustomerLogin() {
  const { signInWithGoogle, user, loginWithPhone, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: "signin" or "signup"
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form states
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [division, setDivision] = useState("Dhaka");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [phoneAlreadyExists, setPhoneAlreadyExists] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/account";

  // Convert any digits to standard English digits
  const cleanInputNumber = (val: string) => {
    return val.replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6)).trim();
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setPhoneAlreadyExists(false);
    setSuccessMsg(null);

    const cleanId = cleanInputNumber(identifier);
    const isEmail = cleanId.includes("@");
    // For phone numbers, allow seamless passwordless or default password login
    const cleanPass = password.trim() || (!isEmail ? "123456" : "");

    if (!cleanId) {
      setErrorMsg("Please enter your mobile phone number.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && !address.trim()) {
      setErrorMsg("Please enter your delivery address.");
      setLoading(false);
      return;
    }

    if (!cleanPass && isEmail) {
      setErrorMsg("Please enter a password for your email account.");
      setLoading(false);
      return;
    }

    try {
      // 1. Direct check for Admin Login credentials
      const lowerId = cleanId.toLowerCase();
      const isPrimaryAdmin =
        (lowerId === "mdm859219@gmail.com" || lowerId === "mdm859219" || lowerId === "admin@worldbuybd.com" || lowerId === "admin") &&
        (cleanPass === "@11489521@" || cleanPass === "11489521" || cleanPass === "admin" || cleanPass === "admin123");

      const isRadowanAdmin =
        (lowerId === "radowan121537@gmail.com" || lowerId === "radowan") &&
        (cleanPass === "1215375123" || cleanPass === "121537" || cleanPass === "@11489521@" || cleanPass === "11489521");

      if (isPrimaryAdmin || isRadowanAdmin) {
        const resolvedEmail = lowerId.includes("@") ? lowerId : "mdm859219@gmail.com";
        localStorage.setItem("admin_user", JSON.stringify({ role: "admin", name: "Super Admin", email: resolvedEmail }));
        navigate("/admin", { replace: true });
        return;
      }

      // Check backend admin auth if email matches
      if (lowerId.includes("@")) {
        try {
          const adminRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: lowerId, password: cleanPass })
          });
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            if (adminData.success && adminData.role === "admin") {
              localStorage.setItem("admin_user", JSON.stringify(adminData.data || { role: "admin", name: "Super Admin", email: lowerId }));
              navigate("/admin", { replace: true });
              return;
            }
          }
        } catch {
          // Continue to customer auth
        }
      }

      // 2. Customer Auth Logic
      if (mode === "signup") {
        // Enforce 1 Phone Number = 1 Account Only
        const res = await fetch("/api/auth/register-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: isEmail ? "" : cleanId,
            email: isEmail ? cleanId : email.trim(),
            address: address.trim(),
            division: division.trim(),
            postalCode: postalCode.trim(),
            password: cleanPass
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg("Account successfully created with all details! Loading your dashboard...");
          const userStorageKey = data.user?.uid || cleanId;
          const fullProfile = {
            name: name.trim(),
            phone: isEmail ? "" : cleanId,
            email: isEmail ? cleanId : email.trim(),
            address: address.trim(),
            division: division.trim(),
            postalCode: postalCode.trim()
          };
          localStorage.setItem(`customer_profile_${userStorageKey}`, JSON.stringify(fullProfile));
          loginWithPhone(cleanId, { ...data.user, ...fullProfile, isNewAccount: true });
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 400);
        } else {
          // Check if already registered
          const errText = data.error || "";
          if (errText.includes("already has an account") || errText.includes("already exists") || data.alreadyExists) {
            setPhoneAlreadyExists(true);
            setErrorMsg(`An account with phone number ${cleanId} already exists! You cannot open multiple accounts with the same phone number.`);
          } else {
            setErrorMsg(errText || "Registration failed. Please check your details and try again.");
          }
        }
      } else {
        // Sign In mode
        const res = await fetch("/api/auth/login-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanId,
            password: cleanPass,
            name: name.trim() || undefined,
            autoRegister: true
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.isNewAccount) {
            setSuccessMsg("Phone number recognized and account connected!");
          } else {
            setSuccessMsg("Successfully signed in! Your registered details are loaded.");
          }
          // Preserve server profile in client profile storage
          const userStorageKey = data.user?.uid || cleanId;
          const fullProfile = {
            name: data.user.name || data.user.displayName || "Customer",
            phone: data.user.phone || data.user.phoneNumber || cleanId,
            email: data.user.email || "",
            address: data.user.address || "",
            division: data.user.division || "Dhaka",
            postalCode: data.user.postalCode || ""
          };
          localStorage.setItem(`customer_profile_${userStorageKey}`, JSON.stringify(fullProfile));
          loginWithPhone(cleanId, { ...data.user, ...fullProfile, isNewAccount: Boolean(data.isNewAccount) });
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 400);
        } else {
          setErrorMsg(data.error || "Sign in failed. Please check your phone number and try again.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Network connection error. Please verify your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show clear Active Session screen (no repeated logins)
  if (user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-600 selection:text-white">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/60 relative z-10 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Active Single Session Connected</h2>
          <p className="text-xs text-slate-300 mb-4">
            You are already logged in on this device with:
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-6 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Phone / Account:</span>
              <span className="font-mono font-bold text-cyan-400">
                {user.phoneNumber || user.phone || user.email || "Active User"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Name:</span>
              <span className="font-semibold text-slate-200">
                {user.displayName || user.name || "Customer"}
              </span>
            </div>
            {user.address && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Delivery Address:</span>
                <span className="text-slate-300 truncate max-w-[200px]">
                  {user.address}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Single Account Active — All details synced with Dashboard</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate(from, { replace: true })}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/account", { replace: true })}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              My Account & Dashboard Details
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                setErrorMsg(null);
                setSuccessMsg("Signed out. You can now connect a different phone number.");
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-rose-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out to use a different phone number</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-600 selection:text-white">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Store Top Bar */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
        <span className="text-[11px] text-blue-400 flex items-center gap-1 font-medium bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          100% Secure Sourcing Platform
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-blue-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/60 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-1 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl mb-3 shadow-lg shadow-blue-500/20">
            <div className="bg-slate-950 px-4 py-2 rounded-xl flex items-center justify-center">
              <span className="font-extrabold text-xl tracking-wider text-white">
                WORLD <span className="text-cyan-400">BUY BD</span>
              </span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === "signin" ? "Customer Sign In" : "Create Customer Account"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === "signin"
              ? "Sign in once with your phone number to access your orders and dashboard."
              : "Register your delivery details once. Exactly one account is allowed per phone number."}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setPhoneAlreadyExists(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "signin"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setPhoneAlreadyExists(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Strict 1 Number = 1 Account Notice */}
        <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-2.5 leading-relaxed">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300">1 Phone Number = 1 Account Policy</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Only one account can be opened per phone number. All details entered during registration will be permanently connected to your customer dashboard.
            </p>
          </div>
        </div>

        {/* Warning if phone number is already registered */}
        {phoneAlreadyExists && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 text-sm">Account Already Exists!</strong>
                <p className="mt-0.5 text-slate-300 leading-relaxed">
                  This phone number is already registered. You cannot create multiple accounts with the same phone number.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setPhoneAlreadyExists(false);
                setErrorMsg(null);
              }}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <span>Sign In with this Phone Number</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {!phoneAlreadyExists && errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-snug font-medium">{successMsg}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Sign Up only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          {/* Identifier Field (Mobile Number) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Mobile Phone Number <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-cyan-400 font-medium bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50 font-mono">
                01XXXXXXXXX
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(cleanInputNumber(e.target.value));
                  if (phoneAlreadyExists) setPhoneAlreadyExists(false);
                }}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-colors font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {mode === "signup"
                ? "This 11-digit number will be permanently bound to your single account."
                : "Enter your registered 11-digit mobile number."}
            </p>
          </div>

          {/* Extended Details for Create Account */}
          {mode === "signup" && (
            <>
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. tanvir@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Detailed Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Delivery Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="House, Road, Area, Ward/Thana..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
              </div>

              {/* Division & Postal Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Division / Region
                  </label>
                  <div className="relative">
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chattogram">Chattogram</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Barishal">Barishal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Postal Code <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1230"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {mode === "signin" ? "Password (Optional for Phone)" : "Password"}
              </label>
              {mode === "signin" && (
                <span className="text-[10px] text-slate-400">
                  Leave blank for instant 1-click login
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "signin" ? "Enter password or leave blank" : "Set your account password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Permanent Login Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-950 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-xs text-slate-300 cursor-pointer select-none">
              Stay permanently logged in on this device (No repeated logins)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : mode === "signin" ? (
              <>
                <span>Sign In with Phone Number</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create Single Account & Connect</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-xs text-slate-400 font-medium">
            OR
          </span>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-slate-200 transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Helpline Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            Need assistance with registration or your account?
          </p>
          <a
            href="tel:+8801355136661"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
          >
            +880 1355-136661
          </a>
        </div>
      </div>
    </div>
  );
}
