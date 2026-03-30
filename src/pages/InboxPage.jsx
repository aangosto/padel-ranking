// src/pages/InboxPage.jsx
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";

const TYPE_META = {
  MATCH_CREATED: { icon: "🎾", color: "#a3e635" },
  MATCH_EDITED:  { icon: "✏️", color: "#fbbf24" },
};

export default function InboxPage() {
  const { user } = useAuth();
  const { notifs, markRead, markAllRead } = useNotifications(user?.uid);
  const navigate = useNavigate();

  const unread = notifs.filter((n) => !n.read).length;

  const handleClick = async (n) => {
    await markRead(n.id);
    if (n.matchId) navigate(`/match/edit/${n.matchId}`);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          fontFamily: "var(--font-head)", fontWeight: 900,
          fontSize: 28, letterSpacing: 3, textTransform: "uppercase",
        }}>
          Buzón <span style={{ color: "var(--accent)" }}>
            {unread > 0 && `(${unread})`}
          </span>
        </div>
        {unread > 0 && (
          <button className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }} onClick={markAllRead}>
            Marcar todo leído
          </button>
        )}
      </div>

      {notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>No tienes notificaciones.</div>
        </div>
      )}

      {notifs.map((n) => {
        const meta = TYPE_META[n.type] || { icon: "📬", color: "var(--text2)" };
        const ts = n.ts?.toDate?.();
        return (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            style={{
              background: n.read ? "var(--bg2)" : "var(--bg3)",
              border: `1px solid ${n.read ? "var(--border)" : meta.color + "44"}`,
              borderRadius: "var(--radius)", padding: "14px 16px",
              cursor: "pointer", display: "flex", gap: 14,
              transition: "border-color 0.15s",
              position: "relative",
            }}
          >
            {!n.read && (
              <div style={{
                position: "absolute", top: 12, right: 12,
                width: 8, height: 8, borderRadius: "50%",
                background: meta.color,
                boxShadow: `0 0 8px ${meta.color}`,
              }} />
            )}
            <div style={{ fontSize: 22, flexShrink: 0 }}>{meta.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "var(--font-head)", fontWeight: 700,
                fontSize: 15, color: n.read ? "var(--text2)" : "var(--text)",
                marginBottom: 4,
              }}>{n.title}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 13,
                color: "var(--text3)", lineHeight: 1.4,
              }}>{n.body}</div>
              {ts && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                  {ts.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
