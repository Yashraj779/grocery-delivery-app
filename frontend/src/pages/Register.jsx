import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import styles from "./AuthPage.module.css";

const initialForm = { name: "", email: "", password: "" };

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please login." },
      });
    } catch (apiError) {
      setError(apiError.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.bgGlowOne}></div>
      <div className={styles.bgGlowTwo}></div>

      <main className={styles.card}>
        <p className={styles.eyebrow}>Create account</p>
        <h1>Start with QuickBasket</h1>
        <p className={styles.subtitle}>Sign up to save your cart and place orders faster.</p>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Name
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={updateField("name")}
              autoComplete="name"
            />
          </label>

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
              placeholder="Create a password"
              value={form.password}
              onChange={updateField("password")}
              autoComplete="new-password"
            />
          </label>

          <button className={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </main>
    </div>
  );
}

export default Register;
