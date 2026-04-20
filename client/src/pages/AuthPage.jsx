import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export const AuthPage = () => {
  const { signup, login, mfaPending, completeMfaLogin } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onInput = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await signup(form);
      setMessage("Signup successful. You can now log in.");
      setMode("login");
    } catch (signupError) {
      setError(signupError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await login({
        email: form.email,
        password: form.password
      });
      if (result.mfaRequired) {
        setMessage("MFA required. Enter your 6-digit OTP.");
      }
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await completeMfaLogin(otp);
    } catch (otpError) {
      setError(otpError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(61,213,243,0.16),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(66,245,173,0.12),_transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-panel p-6 shadow-glass backdrop-blur-xl"
      >
        <h1 className="font-display text-2xl font-semibold text-white">Secure Authentication Framework</h1>
        <p className="mt-2 text-sm text-muted">OS-Level Authentication Simulation + Supabase Security</p>

        <div className="mt-5 flex gap-2 rounded-xl border border-border bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              mode === "login" ? "bg-accent/20 text-accent" : "text-muted"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              mode === "signup" ? "bg-accent/20 text-accent" : "text-muted"
            }`}
          >
            Signup
          </button>
        </div>

        {mfaPending ? (
          <form className="mt-5 space-y-3" onSubmit={handleOtpVerification}>
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-accent2/40 bg-accent2/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent2"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : mode === "signup" ? (
          <form className="mt-5 space-y-3" onSubmit={handleSignup}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onInput}
              placeholder="Full name"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onInput}
              placeholder="Email address"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onInput}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-accent2/40 bg-accent2/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent2"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onInput}
              placeholder="Email address"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onInput}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-accent/40 bg-accent/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
            >
              {loading ? "Signing In..." : "Login Securely"}
            </button>
          </form>
        )}

        {message ? <p className="mt-4 text-xs text-accent2">{message}</p> : null}
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </motion.div>
    </main>
  );
};
