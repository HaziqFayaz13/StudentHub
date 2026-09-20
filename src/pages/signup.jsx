import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api/auth";

function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSecurityAnswer = securityAnswer.trim().toLowerCase();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword ||
      !cleanSecurityAnswer
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (cleanSecurityAnswer.length < 2) {
      setError("Please enter a valid answer");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: password,
          securityAnswer: cleanSecurityAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Account creation failed");
      }

      console.log("ACCOUNT CREATED:", data.user);

      setSuccess("Account created successfully!");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSecurityAnswer("");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message || "Account creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-background-shape shape-one"></div>
      <div className="auth-background-shape shape-two"></div>

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">S</div>

          <div>
            <h2>StudentHub</h2>
            <span>Academic Dashboard</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-eyebrow">GET STARTED</span>

            <h1>Create your account</h1>

            <p>
              Create your StudentHub account and manage your academic journey
              in one place.
            </p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {/* NAME */}
            <div className="auth-field">
              <label htmlFor="name">Full name</label>

              <div className="auth-input-wrapper">
                <span
                  className="auth-input-icon"
                  style={{ pointerEvents: "none" }}
                >
                  S
                </span>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="auth-input-wrapper">
                <span
                  className="auth-input-icon"
                  style={{ pointerEvents: "none" }}
                >
                  @
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="auth-input-wrapper">
                <span
                  className="auth-input-icon"
                  style={{ pointerEvents: "none" }}
                >
                  •
                </span>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="auth-input-wrapper">
                <span
                  className="auth-input-icon"
                  style={{ pointerEvents: "none" }}
                >
                  •
                </span>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* SECURITY QUESTION */}
            <div className="auth-field">
              <label>Security question</label>

              <div
                style={{
                  fontSize: "13px",
                  color: "var(--ink)",
                  marginTop: "2px",
                  marginBottom: "3px",
                  paddingLeft: "2px",
                }}
              >
                What is your favourite food?
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  paddingLeft: "2px",
                  marginBottom: "4px",
                }}
              >
                This answer will be used for future password reset.
              </div>
            </div>

            {/* SECURITY ANSWER */}
            <div className="auth-field">
              <label htmlFor="securityAnswer">Your answer</label>

              <div className="auth-input-wrapper">
                <span
                  className="auth-input-icon"
                  style={{ pointerEvents: "none" }}
                >
                  ✓
                </span>

                <input
                  id="securityAnswer"
                  name="securityAnswer"
                  type="text"
                  value={securityAnswer}
                  onChange={(event) =>
                    setSecurityAnswer(event.target.value)
                  }
                  placeholder="Enter your answer"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="auth-error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <span className="auth-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </div>

        <div className="auth-bottom">
          Your academic workspace, all in one place.
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
