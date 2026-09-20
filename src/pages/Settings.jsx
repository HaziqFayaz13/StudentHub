import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const API_BASE = "/api";

export default function Settings() {
  const {
    profile,
    setProfile,
    prefs,
    setPrefs,
    pushToast,
    loggedInUserId,
  } = useApp();

  const { theme, setTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    campus: "",
    program: "",
    year: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: profile?.name || "",
      email: profile?.email || "",
      rollNumber: profile?.rollNumber || "",
      campus: profile?.campus || "",
      program: profile?.program || "",
      year: profile?.year || "",
    });
  }, [profile]);

  useEffect(() => {
    async function loadSettings() {
      const token = localStorage.getItem("studenthub-token");

      if (!token || !loggedInUserId) {
        setLoadingSettings(false);
        return;
      }

      try {
        setLoadingSettings(true);

        const response = await fetch(`${API_BASE}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          setLoadingSettings(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const data = await response.json();

        setPrefs({
          attendanceAlerts: Boolean(data.attendanceAlerts),
          classReminders: Boolean(data.classReminders),
          weeklyDigest: Boolean(data.weeklyDigest),
          compactTables: Boolean(data.compactTables),
        });
      } catch (error) {
        console.error("Error loading settings:", error);
        pushToast("Failed to load settings", "rose");
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, [loggedInUserId]);

  async function saveProfile() {
    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login again", "rose");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          rollNumber: profileForm.rollNumber,
          college: profileForm.campus,
          program: profileForm.program,
          yearSemester: profileForm.year,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedUser = data.user || data;

      const updatedProfile = {
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        rollNumber: updatedUser.rollNumber || "",
        campus: updatedUser.college || "",
        program: updatedUser.program || "",
        year: updatedUser.yearSemester || "",
      };

      setProfile(updatedProfile);

      const savedUser = localStorage.getItem("studenthub-user");

      if (savedUser) {
        try {
          const oldUser = JSON.parse(savedUser);

          localStorage.setItem(
            "studenthub-user",
            JSON.stringify({
              ...oldUser,
              ...updatedUser,
            })
          );
        } catch (error) {
          console.error("Error updating saved user:", error);
        }
      }

      pushToast("Profile updated successfully", "green");
    } catch (error) {
      console.error("Error updating profile:", error);
      pushToast(error.message || "Failed to update profile", "rose");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      pushToast("Please fill all password fields", "rose");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      pushToast("New password must be at least 6 characters", "rose");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      pushToast("New passwords do not match", "rose");
      return;
    }

    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login again", "rose");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(`${API_BASE}/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      pushToast("Password changed successfully", "green");
    } catch (error) {
      console.error("Error changing password:", error);
      pushToast(error.message || "Failed to change password", "rose");
    } finally {
      setChangingPassword(false);
    }
  }

  async function saveSettings() {
    const token = localStorage.getItem("studenthub-token");

    if (!token) {
      pushToast("Please login again", "rose");
      return;
    }

    try {
      setSavingSettings(true);

      const response = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendanceAlerts: prefs.attendanceAlerts,
          classReminders: prefs.classReminders,
          weeklyDigest: prefs.weeklyDigest,
          compactTables: prefs.compactTables,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save settings");
      }

      if (data.settings) {
        setPrefs({
          attendanceAlerts: Boolean(data.settings.attendanceAlerts),
          classReminders: Boolean(data.settings.classReminders),
          weeklyDigest: Boolean(data.settings.weeklyDigest),
          compactTables: Boolean(data.settings.compactTables),
        });
      }

      pushToast("Settings saved successfully", "green");
    } catch (error) {
      console.error("Error saving settings:", error);
      pushToast(error.message || "Failed to save settings", "rose");
    } finally {
      setSavingSettings(false);
    }
  }

  function updatePref(key) {
    setPrefs((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <div className="stack">

      <div className="welcome">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p className="lede">
            Manage your profile, password, appearance and preferences.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Profile</h2>
            <p className="muted">
              Update your personal and academic information.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                name: value,
              }))
            }
          />

          <Input
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                email: value,
              }))
            }
          />

          <Input
            label="Roll Number"
            value={profileForm.rollNumber}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                rollNumber: value,
              }))
            }
          />

          <Input
            label="College"
            value={profileForm.campus}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                campus: value,
              }))
            }
          />

          <Input
            label="Program"
            value={profileForm.program}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                program: value,
              }))
            }
          />

          <Input
            label="Year / Semester"
            value={profileForm.year}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                year: value,
              }))
            }
          />
        </div>

        <div className="form-actions">
          <button
            className="button primary"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Change Password</h2>
            <p className="muted">
              Keep your StudentHub account secure.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({
                ...current,
                currentPassword: value,
              }))
            }
          />

          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({
                ...current,
                newPassword: value,
              }))
            }
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({
                ...current,
                confirmPassword: value,
              }))
            }
          />
        </div>

        <div className="form-actions">
          <button
            className="button primary"
            onClick={changePassword}
            disabled={changingPassword}
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Appearance</h2>
            <p className="muted">
              Choose how StudentHub looks.
            </p>
          </div>
        </div>

        <div className="segmented">
          {["light", "dark", "system"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={theme === option ? "is-on" : ""}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Preferences</h2>
            <p className="muted">
              These preferences are saved separately for your account.
            </p>
          </div>
        </div>

        {loadingSettings ? (
          <div className="loader">
            <p>Loading settings...</p>
          </div>
        ) : (
          <div>
            <Preference
              title="Attendance Alerts"
              description="Receive alerts related to attendance."
              checked={prefs.attendanceAlerts}
              onChange={() => updatePref("attendanceAlerts")}
            />

            <Preference
              title="Class Reminders"
              description="Receive reminders for upcoming classes."
              checked={prefs.classReminders}
              onChange={() => updatePref("classReminders")}
            />

            <Preference
              title="Weekly Digest"
              description="Receive a weekly summary of your StudentHub activity."
              checked={prefs.weeklyDigest}
              onChange={() => updatePref("weeklyDigest")}
            />

            <Preference
              title="Compact Tables"
              description="Use a more compact layout for tables."
              checked={prefs.compactTables}
              onChange={() => updatePref("compactTables")}
            />
          </div>
        )}

        <div className="form-actions">
          <button
            className="button primary"
            onClick={saveSettings}
            disabled={savingSettings || loadingSettings}
          >
            {savingSettings ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </section>

    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label>
      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Preference({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="switch-row">
      <div>
        <strong>{title}</strong>
        <p className="muted">{description}</p>
      </div>

      <button
        type="button"
        className={`button small ${checked ? "primary" : ""}`}
        onClick={onChange}
        aria-label={title}
      >
        {checked ? "ON" : "OFF"}
      </button>
    </div>
  );
}
