import { UserPlus } from "lucide-react";
import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { parseError } from "../utils/errors.js";

function SignupPage({ onSubmit, setView }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    skillLevel: "Beginner",
    expertise: "",
    desiredSkills: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        name: form.name,
        email: form.email,
        password: form.password,
        skillLevel: form.skillLevel,
        expertise: form.expertise,
        desiredSkills: form.desiredSkills
      });
    } catch (authError) {
      setError(parseError(authError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Add your first teach and learn skills for matching later.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Full name"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <div className="two-column">
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          />
          <Field
            label="Confirm"
            type="password"
            value={form.confirmPassword}
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
          />
        </div>
        <label className="field">
          <span>Skill level</span>
          <select
            value={form.skillLevel}
            onChange={(event) => setForm((current) => ({ ...current, skillLevel: event.target.value }))}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>
        <Field
          label="Skills you can teach"
          placeholder="React, guitar, English"
          value={form.expertise}
          onChange={(value) => setForm((current) => ({ ...current, expertise: value }))}
        />
        <Field
          label="Skills you want to learn"
          placeholder="Figma, public speaking"
          value={form.desiredSkills}
          onChange={(value) => setForm((current) => ({ ...current, desiredSkills: value }))}
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button full" type="submit" disabled={loading}>
          <UserPlus size={18} />
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>

      <button className="text-button" type="button" onClick={() => setView("login")}>
        Already have an account? Login
      </button>
    </AuthLayout>
  );
}

export default SignupPage;
