import { LogIn } from "lucide-react";
import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { parseError } from "../utils/errors.js";

function LoginPage({ onSubmit, setView }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (authError) {
      setError(parseError(authError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue building your SkillSwap profile.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button full" type="submit" disabled={loading}>
          <LogIn size={18} />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <button className="text-button" type="button" onClick={() => setView("signup")}>
        Need an account? Sign up
      </button>
    </AuthLayout>
  );
}

export default LoginPage;
