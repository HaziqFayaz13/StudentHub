import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api/auth";

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================================================
  // NORMAL LOGIN
  // ======================================================

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        throw new Error(
          "Please enter email and password"
        );
      }

      console.log("LOGIN REQUEST STARTED");
      console.log("LOGIN EMAIL:", cleanEmail);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            password: password,
          }),
        }
      );

      const responseText = await response.text();

      console.log(
        "LOGIN HTTP STATUS:",
        response.status
      );

      console.log(
        "LOGIN RESPONSE:",
        responseText
      );

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Login failed with status ${response.status}`
        );
      }

      if (!data.token) {
        throw new Error(
          "Login successful but server did not return a token"
        );
      }

      if (!data.user) {
        throw new Error(
          "Login successful but server did not return user information"
        );
      }

      console.log(
        "LOGIN TOKEN RECEIVED"
      );

      console.log(
        "LOGIN USER:",
        data.user
      );

      console.log(
        "LOGIN USER ID:",
        data.user.id
      );

      // ==========================================
      // SAVE LOGIN DATA
      // ==========================================

      localStorage.setItem(
        "studenthub-token",
        data.token
      );

      localStorage.setItem(
        "studenthub-user",
        JSON.stringify(data.user)
      );

      // ==========================================
      // SAVE PROFILE
      // ==========================================

      const profile = {
        name: data.user.name || "",
        email: data.user.email || "",
        rollNumber:
          data.user.rollNumber || "",
        campus:
          data.user.college || "",
        program:
          data.user.program || "",
        year:
          data.user.yearSemester || "",
      };

      localStorage.setItem(
        "studenthub-profile",
        JSON.stringify(profile)
      );

      console.log(
        "TOKEN SAVED:",
        Boolean(
          localStorage.getItem(
            "studenthub-token"
          )
        )
      );

      console.log(
        "USER SAVED:",
        Boolean(
          localStorage.getItem(
            "studenthub-user"
          )
        )
      );

      // ==========================================
      // APP LOGIN CALLBACK
      // ==========================================

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      // ==========================================
      // DASHBOARD
      // ==========================================

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        error?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // OPEN FORGOT PASSWORD
  // ======================================================

  function openForgotPassword() {
    setMode("forgot");
    setError("");
    setSuccess("");
    setSecurityAnswer("");
    setResetToken("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  // ======================================================
  // VERIFY SECURITY ANSWER
  // ======================================================

  async function handleVerifySecurityAnswer(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      const cleanAnswer =
        securityAnswer.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          "Please enter your email address"
        );
      }

      if (!cleanAnswer) {
        throw new Error(
          "Please enter your answer"
        );
      }

      const response = await fetch(
        `${API_URL}/forgot-password/verify`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            securityAnswer: cleanAnswer,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Incorrect answer. Try again."
        );
      }

      if (!data.resetToken) {
        throw new Error(
          "Verification successful but reset token was not received"
        );
      }

      setResetToken(data.resetToken);
      setMode("reset");
      setSuccess(
        "Answer verified. You can now create a new password."
      );
    } catch (error) {
      console.error(
        "SECURITY ANSWER ERROR:",
        error
      );

      setError(
        error?.message ||
          "Incorrect answer. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // RESET PASSWORD
  // ======================================================

  async function handleResetPassword(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword || !confirmNewPassword) {
      setError(
        "Please enter and confirm your new password"
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters"
      );
      return;
    }

    if (
      newPassword !== confirmNewPassword
    ) {
      setError(
        "Passwords do not match"
      );
      return;
    }

    if (!resetToken) {
      setError(
        "Reset session expired. Please try again."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password/reset`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            resetToken: resetToken,
            newPassword: newPassword,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to reset password"
        );
      }

      setSuccess(
        "Password reset successfully! Please sign in."
      );

      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSecurityAnswer("");
      setResetToken("");

      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 1500);
    } catch (error) {
      console.error(
        "PASSWORD RESET ERROR:",
        error
      );

      setError(
        error?.message ||
          "Password reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // BACK TO LOGIN
  // ======================================================

  function backToLogin() {
    setMode("login");
    setError("");
    setSuccess("");
    setSecurityAnswer("");
    setResetToken("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="auth-screen">

      <div className="auth-background-shape shape-one"></div>
      <div className="auth-background-shape shape-two"></div>

      <div className="auth-container">

        {/* BRAND */}

        <div className="auth-brand">

          <div className="auth-logo">
            S
          </div>

          <div>
            <h2>StudentHub</h2>
            <span>
              Academic Dashboard
            </span>
          </div>

        </div>

        {/* AUTH CARD */}

        <div className="auth-card">

          {/* ==================================================
              NORMAL LOGIN
          ================================================== */}

          {mode === "login" && (
            <>
              <div className="auth-heading">

                <span className="auth-eyebrow">
                  WELCOME BACK
                </span>

                <h1>
                  Sign in to your account
                </h1>

                <p>
                  Manage your classes, attendance,
                  CGPA and academic resources in
                  one place.
                </p>

              </div>

              <form
                onSubmit={handleLogin}
                className="auth-form"
              >

                {/* EMAIL */}

                <div className="auth-field">

                  <label htmlFor="email">
                    Email address
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      @
                    </span>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="password">
                    Password
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      •
                    </span>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />

                  </div>

                </div>

                {/* FORGOT PASSWORD */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                    marginTop: "-8px",
                    marginBottom: "4px",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      openForgotPassword
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Forgot password?
                  </button>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="auth-error">

                    <span>!</span>

                    {error}

                  </div>
                )}

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="auth-spinner"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in

                      <span className="auth-arrow">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              {/* SIGNUP */}

              <div className="auth-footer">

                <span>
                  New to StudentHub?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/signup")
                  }
                >
                  Create an account
                </button>

              </div>
            </>
          )}

          {/* ==================================================
              FORGOT PASSWORD
          ================================================== */}

          {mode === "forgot" && (
            <>
              <div className="auth-heading">

                <span className="auth-eyebrow">
                  PASSWORD RECOVERY
                </span>

                <h1>
                  Forgot your password?
                </h1>

                <p>
                  Answer your security question
                  to create a new password.
                </p>

              </div>

              <form
                onSubmit={
                  handleVerifySecurityAnswer
                }
                className="auth-form"
              >

                {/* EMAIL */}

                <div className="auth-field">

                  <label htmlFor="forgotEmail">
                    Email address
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      @
                    </span>

                    <input
                      id="forgotEmail"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>

                {/* QUESTION */}

                <div className="auth-field">

                  <label htmlFor="securityQuestion">
                    Security question
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      ?
                    </span>

                    <input
                      id="securityQuestion"
                      type="text"
                      value="What is your favourite food?"
                      readOnly
                    />

                  </div>

                </div>

                {/* ANSWER */}

                <div className="auth-field">

                  <label htmlFor="securityAnswer">
                    Your answer
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      ✓
                    </span>

                    <input
                      id="securityAnswer"
                      type="text"
                      value={securityAnswer}
                      onChange={(event) =>
                        setSecurityAnswer(
                          event.target.value
                        )
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

                {/* VERIFY BUTTON */}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="auth-spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify answer

                      <span className="auth-arrow">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              <div className="auth-footer">

                <button
                  type="button"
                  onClick={
                    backToLogin
                  }
                >
                  ← Back to sign in
                </button>

              </div>
            </>
          )}

          {/* ==================================================
              RESET PASSWORD
          ================================================== */}

          {mode === "reset" && (
            <>
              <div className="auth-heading">

                <span className="auth-eyebrow">
                  NEW PASSWORD
                </span>

                <h1>
                  Create new password
                </h1>

                <p>
                  Your security answer was
                  verified. Set a new password
                  for your account.
                </p>

              </div>

              <form
                onSubmit={
                  handleResetPassword
                }
                className="auth-form"
              >

                {/* NEW PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="newPassword">
                    New password
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      •
                    </span>

                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                    />

                  </div>

                </div>

                {/* CONFIRM NEW PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="confirmNewPassword">
                    Confirm new password
                  </label>

                  <div className="auth-input-wrapper">

                    <span className="auth-input-icon">
                      •
                    </span>

                    <input
                      id="confirmNewPassword"
                      type="password"
                      value={
                        confirmNewPassword
                      }
                      onChange={(event) =>
                        setConfirmNewPassword(
                          event.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      autoComplete="new-password"
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

                {/* RESET BUTTON */}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="auth-spinner"></span>
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset password

                      <span className="auth-arrow">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>
            </>
          )}

        </div>

        {/* BOTTOM */}

        <div className="auth-bottom">
          Your academic workspace, all in one place.
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
