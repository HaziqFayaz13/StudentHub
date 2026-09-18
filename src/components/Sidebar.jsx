import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { initials } from "../data.js";

const items = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/attendance", label: "Attendance", icon: "attendance" },
  { to: "/cgpa", label: "CGPA", icon: "cap" },
  { to: "/timetable", label: "Class Time Table", icon: "calendar" },
  { to: "/notes", label: "Notes", icon: "notes" },
  { to: "/papers", label: "Previous Papers", icon: "papers" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

function Sidebar({ open, collapsed, onClose, onToggleCollapse }) {
  const { profile } = useApp();

  return (
    <>
      {open ? <button type="button" className="sidebar-backdrop" aria-label="Close sidebar" onClick={onClose} /> : null}
      <aside className={`sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SH</span>
          <div className="brand-copy">
            <strong>StudentHub</strong>
            <p>Academic workspace</p>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}
              onClick={onClose}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="collapse-btn" onClick={onToggleCollapse}>
          <Icon name="chevron" />
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>

        <div className="sidebar-user">
          <span className="avatar">{initials(profile.name)}</span>
          <div className="brand-copy">
            <strong>{profile.name}</strong>
            <p>{profile.program}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
