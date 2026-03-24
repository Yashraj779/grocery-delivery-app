import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginUser } from "../services/api";
import styles from "./AuthPage.module.css";

const initialForm = { email: "", password: "" };

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = useMemo(
    () => location.state?.message || "",
    [location.state],
  );

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      login({ token: response.token, user: response.user });
      navigate("/", { replace: true });
    } catch (apiError) {
      setError(apiError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.bgGlowOne}></div>
      <div className={styles.bgGlowTwo}></div>

      <main className={styles.card}>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1>Login to QuickBasket</h1>
        <p className={styles.subtitle}>Track orders, manage your cart, and checkout in seconds.</p>

        {successMessage && <p className={styles.success}>{successMessage}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField("email")}
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={updateField("password")}
              autoComplete="current-password"
            />
          </label>

          <button className={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={styles.switchText}>
          New to QuickBasket? <Link to="/register">Create an account</Link>
        </p>
      </main>
    </div>
  );
}

export default Login;
