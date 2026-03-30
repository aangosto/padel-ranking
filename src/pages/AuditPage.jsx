// src/pages/AuditPage.jsx
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../components/UI";

const EVENT_META = {
  USER_REGISTERED: { icon: "🆕", label: "Nuevo registro",   color: "#a3e635" },
  USER_LOGIN:      { icon: "🔑", label: "Login",            color: "#60a5fa" },
  PROFILE_UPDATED: { icon: "✏️", label: "Perfil editado",   color: "#fbbf24" },
  MATCH_CREATED:   { icon: "🎾", label: "Partido creado",   color: "#34d399" },
  MATCH_EDITED:    { icon: "⚠️", label: "Partido editado",  color: "#f87171" },
};

const PAGE_SIZE = 25;

export default function AuditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.uid === import.meta.env.VITE_ADMIN_UID;

  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastDoc, setLastDoc]     = useState(null);
  const [hasMore, setHasMore]     = useState(true);
  const [filter, setFilter]       = useState("ALL");

  useEffect(() => {
    if (!isAdmin) { navigate("/ranking"); return; }
    fetchPage(true);
  }, [isAdmin]);

  const fetchPage = async (reset = false) => {
    setLoading(true);
    let q = query(collection(db, "audit"), orderBy("ts", "desc"), limit(PAGE_SIZE));
    if (!reset && lastDoc) q = query(collection(db, "audit"), orderBy("ts", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
    const snap = await getDocs(q);
    const newLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setLogs(reset ? newLogs : (prev) => [...prev, ...newLogs]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoading(false);
  };

  const EVENT_TYPES = ["ALL", ...Object.keys(EVENT_META)];
  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.event === filter);

  if (!isAdmin) return null;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{
          fontFamily: "var(--font-head)", fontWeight: 900,
          fontSize: 28, letterSpacing: 3, textTransform: "uppercase",
        }}>
          🛡 <span style={{ color: "var(--accent)" }}>Auditoría</span>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
          Registro completo de eventos del sistema
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EVENT_TYPES.map((type) => {
          const meta = EVENT_META[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: "5px 12px",
                fontFamily: "var(--font-head)", fontWeight: 700,
                fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
                borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
                background: filter === type ? (meta?.color + "22" || "#a3e63522") : "var(--bg2)",
                border: `1px solid ${filter === type ? (meta?.color || "#a3e635") : "var(--border2)"}`,
                color: filter === type ? (meta?.color || "#a3e635") : "var(--text3)",
              }}
            >{meta ? `${meta.icon} ${meta.label}` : "Todos"}</button>
          );
        })}
      </div>

      {/* Log list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((log) => {
          const meta = EVENT_META[log.event] || { icon: "❓", label: log.event, color: "var(--text3)" };
          const ts = log.ts?.toDate?.();
          return (
            <div key={log.id} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "12px 14px",
              display: "flex", gap: 12, alignItems: "flex-start",
              borderLeft: `3px solid ${meta.color}`,
            }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{
                    fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: meta.color,
                  }}>{meta.label}</span>
                  {ts && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text3)", flexShrink: 0 }}>
                      {ts.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                  {log.actorName} <span style={{ color: "var(--text3)" }}>({log.actorUid?.slice(0, 8)}...)</span>
                </div>
                {Object.keys(log.meta || {}).length > 0 && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{
                      fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text3)",
                      cursor: "pointer", userSelect: "none",
                    }}>Ver detalles</summary>
                    <pre style={{
                      marginTop: 6, padding: 8,
                      background: "var(--bg3)", borderRadius: 6,
                      fontFamily: "monospace", fontSize: 11,
                      color: "var(--text2)", overflowX: "auto",
                      whiteSpace: "pre-wrap", wordBreak: "break-all",
                    }}>{JSON.stringify(log.meta, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}

        {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>}

        {!loading && hasMore && filter === "ALL" && (
          <button className="btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => fetchPage(false)}>
            Cargar más
          </button>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "var(--text3)", fontFamily: "var(--font-body)" }}>
            No hay eventos de este tipo.
          </div>
        )}
      </div>
    </div>
  );
}
