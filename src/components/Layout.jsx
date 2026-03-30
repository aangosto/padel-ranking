// src/components/Layout.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { Avatar } from "./UI";

const NAV = [
  { to: "/ranking",   label: "Ranking",  icon: "▦" },
  { to: "/match/new", label: "Partido",  icon: "🎾" },
  { to: "/inbox",     label: "Buzón",    icon: "✉" },
  { to: "/profile",   label: "Perfil",   icon: "◉" },
];

export default function Layout({ children }) {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);
  const isAdmin = user?.uid === import.meta.env.VITE_ADMIN_UID;
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top bar */}
      <header style={{
        height: 56, background: "#fff",
        borderBottom: "1.5px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div onClick={() => navigate("/ranking")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            borderRadius: 8, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
          }}>🎾</div>
          <div>
            <div style={{
              fontFamily: "var(--font-head)", fontWeight: 900,
              fontSize: 16, letterSpacing: 1.5, textTransform: "uppercase",
              color: "var(--text)", lineHeight: 1,
            }}>NC <span style={{ color: "var(--accent)" }}>Pádel</span></div>
            <div style={{
              fontFamily: "var(--font-head)", fontSize: 9,
              letterSpacing: 2, color: "var(--text3)",
              textTransform: "uppercase", lineHeight: 1,
            }}>Nueva Condomina · Ranking</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {isAdmin && (
          <button className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => navigate("/audit")}>
            🛡 Auditoría
          </button>
        )}

        <div style={{ cursor: "pointer" }} onClick={() => navigate("/profile")}>
          <Avatar name={profile?.name || ""} photoURL={profile?.photoURL} size={32} />
        </div>
      </header>

      {/* Page */}
      <main style={{ flex: 1, maxWidth: 540, width: "100%", margin: "0 auto", padding: "20px 16px 90px" }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 60, background: "#fff",
        borderTop: "1.5px solid var(--border)",
        display: "flex", zIndex: 100,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
      }}>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 2,
            fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
            letterSpacing: 1, textTransform: "uppercase",
            color: isActive ? "var(--accent)" : "var(--text3)",
            borderTop: isActive ? "2.5px solid var(--accent)" : "2.5px solid transparent",
            transition: "color 0.15s",
            position: "relative",
          })}>
            {item.label === "Buzón" && unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 6, left: "calc(50% + 6px)",
                background: "#dc2626", color: "#fff",
                fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", padding: "0 4px",
                fontFamily: "var(--font-body)",
              }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
