import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { initials } from "../data.js";

function TopBar({ onMenuClick }) {
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  const {
    profile,
    search,
    setSearch,
    notifications,
    setNotifications,
    loggedInUserId,
    unreadCount,
    pushToast,
  } = useApp();

  const [openPanel, setOpenPanel] = useState(null);

  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(event.target)
      ) {
        setOpenPanel(null);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  /*
   * Load previously read notifications for the current user.
   * Read status is stored separately for each logged-in user.
   */
  useEffect(() => {
    if (!loggedInUserId) {
      return;
    }

    const storageKey = `studenthub-read-notifications-${loggedInUserId}`;

    try {
      const saved = localStorage.getItem(storageKey);

      if (!saved) {
        return;
      }

      const readIds = JSON.parse(saved);

      if (!Array.isArray(readIds)) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: readIds.includes(String(item.id))
            ? true
            : item.read,
        }))
      );
    } catch (error) {
      console.error(
        "Notification read-state error:",
        error
      );
    }
  }, [loggedInUserId, setNotifications]);

  function saveReadNotificationIds(items) {
    if (!loggedInUserId) {
      return;
    }

    const storageKey = `studenthub-read-notifications-${loggedInUserId}`;

    const readIds = items
      .filter((item) => item.read)
      .map((item) => String(item.id));

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(readIds)
      );
    } catch (error) {
      console.error(
        "Failed to save notification read state:",
        error
      );
    }
  }

  function markAllRead() {
    setNotifications((current) => {
      const updated = current.map((item) => ({
        ...item,
        read: true,
      }));

      saveReadNotificationIds(updated);

      return updated;
    });

    pushToast(
      "All notifications marked as read",
      "green"
    );
  }

  function markNotificationRead(notificationId) {
    setNotifications((current) => {
      const updated = current.map((note) =>
        String(note.id) === String(notificationId)
          ? {
              ...note,
              read: true,
            }
          : note
      );

      saveReadNotificationIds(updated);

      return updated;
    });
  }

  function handleSignOut() {
    // Remove current user's login information
    localStorage.removeItem("studenthub-token");
    localStorage.removeItem("studenthub-user");

    // Remove old user's profile
    localStorage.removeItem("studenthub-profile");

    // Close profile dropdown
    setOpenPanel(null);

    // Go to login page
    navigate("/login", { replace: true });

    // Reload app so all user state resets
    window.location.reload();
  }

  return (
    <header className="topbar" ref={wrapRef}>
      {/* MENU */}
      <button
        type="button"
        className="icon-button menu-button"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>

      {/* SEARCH */}
      <label className="search">
        <Icon name="search" />

        <input
          type="search"
          placeholder="Search notes, papers, or subjects"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </label>

      <div className="topbar-actions">
        {/* THEME */}
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <Icon
            name={theme === "dark" ? "sun" : "moon"}
          />
        </button>

        {/* NOTIFICATIONS */}
        <div className="menu-anchor">
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications"
            onClick={() =>
              setOpenPanel(
                openPanel === "notes"
                  ? null
                  : "notes"
              )
            }
          >
            <Icon name="bell" />

            {unreadCount ? (
              <span className="badge">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {openPanel === "notes" ? (
            <div className="dropdown wide">
              <div className="dropdown-head">
                <strong>
                  Notifications
                </strong>

                <button
                  type="button"
                  className="text-btn"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="muted">
                  You are all caught up.
                </p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`dropdown-item ${
                      item.read ? "" : "is-unread"
                    }`}
                    onClick={() =>
                      markNotificationRead(item.id)
                    }
                  >
                    <strong>
                      {item.title}
                    </strong>

                    <p>
                      {item.body}
                    </p>

                    <span>
                      {item.time}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        {/* PROFILE */}
        <div className="menu-anchor">
          <button
            type="button"
            className="profile-btn"
            onClick={() =>
              setOpenPanel(
                openPanel === "profile"
                  ? null
                  : "profile"
              )
            }
          >
            <span className="avatar">
              {initials(profile.name)}
            </span>

            <span className="profile-copy">
              <strong>
                {profile.name}
              </strong>

              <small>
                {profile.year}
              </small>
            </span>
          </button>

          {openPanel === "profile" ? (
            <div className="dropdown">
              {/* VIEW PROFILE */}
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  navigate("/settings");
                  setOpenPanel(null);
                }}
              >
                View profile
              </button>

              {/* THEME */}
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  toggleTheme();
                  setOpenPanel(null);
                }}
              >
                Switch to{" "}
                {theme === "dark"
                  ? "light"
                  : "dark"}{" "}
                mode
              </button>

              {/* SIGN OUT */}
              <button
                type="button"
                className="dropdown-item"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default TopBar;