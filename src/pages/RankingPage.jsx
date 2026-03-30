// src/pages/RankingPage.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Avatar, TierBadge, SidePill, Spinner } from "../components/UI";
import { getTier } from "../elo";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function RankingPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "users"), orderBy("elo", "desc"));
      const snap = await getDocs(q);
      setPlayers(snap.docs.map((d) => d.data()));
      setLoading(false);
    })();
  }, []);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-head)", fontWeight: 900,
          fontSize: 30, letterSpacing: 3, textTransform: "uppercase", color: "var(--text)",
        }}>
          Ranking <span style={{ color: "var(--accent)" }}>Oficial</span>
        </div>
        <div style={{ color: "var(--text3)", fontFamily: "var(--font-head)", fontSize: 12, letterSpacing: 3, marginTop: 2 }}>
          NUEVA CONDOMINA · SISTEMA ELO
        </div>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={32} /></div>}

      {!loading && players.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
          <div>Aún no hay jugadores en el ranking.</div>
        </div>
      )}

      {/* Podium */}
      {top3.length >= 2 && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((p, i) => {
            const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = { 1: 110, 2: 80, 3: 60 };
            const colors  = { 1: "#b45309", 2: "#64748b", 3: "#92400e" };
            const bgs     = { 1: "#fef3c7", 2: "#f1f5f9", 3: "#fef3c7" };
            const h = heights[pos], c = colors[pos], bg = bgs[pos];
            return (
              <div key={p.uid} onClick={() => navigate(`/player/${p.uid}`)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                {pos === 1 && <span style={{ fontSize: 20, marginBottom: 4 }}>👑</span>}
                <Avatar name={p.name} photoURL={p.photoURL} size={pos === 1 ? 56 : 44} />
                <div style={{
                  fontFamily: "var(--font-head)", fontWeight: 800,
                  fontSize: pos === 1 ? 15 : 13, color: c, marginTop: 6,
                  textAlign: "center", maxWidth: 90,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{p.name.split(" ")[0]}</div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13, color: "var(--text2)" }}>{p.elo}</div>
                <div style={{
                  width: "100%", height: h,
                  background: bg, border: `1.5px solid ${c}44`,
                  borderRadius: "8px 8px 0 0", marginTop: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-head)", fontWeight: 900,
                  fontSize: pos === 1 ? 32 : 24, color: c + "66",
                }}>{pos}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {players.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {players.map((p, idx) => {
            const isMe = p.uid === user?.uid;
            const tier = getTier(p.elo);
            const wl = (p.wins || 0) + (p.losses || 0);
            const winRate = wl > 0 ? Math.round(((p.wins || 0) / wl) * 100) : null;
            return (
              <div key={p.uid}
                onClick={() => navigate(isMe ? "/profile" : `/player/${p.uid}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: isMe ? "#f0fdf4" : "#fff",
                  border: `1.5px solid ${isMe ? "#86efac" : "var(--border)"}`,
                  borderRadius: "var(--radius)", padding: "12px 14px",
                  cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-lg)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow)"}
              >
                <div style={{
                  fontFamily: "var(--font-head)", fontWeight: 900,
                  fontSize: idx < 3 ? 18 : 15, minWidth: 28, textAlign: "center",
                  color: idx === 0 ? "#b45309" : idx === 1 ? "#64748b" : idx === 2 ? "#92400e" : "var(--text3)",
                }}>{idx + 1}</div>

                <Avatar name={p.name} photoURL={p.photoURL} size={40} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16,
                    color: isMe ? "var(--accent2)" : "var(--text)",
                    display: "flex", alignItems: "center", gap: 6,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.name}
                    {isMe && <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1, background: "#dcfce7", padding: "1px 6px", borderRadius: 3 }}>TÚ</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    <TierBadge elo={p.elo} />
                    {p.side && <SidePill side={p.side} />}
                    {winRate !== null && (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text3)" }}>
                        {p.wins || 0}V {p.losses || 0}D · {winRate}%
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22, color: tier.color }}>{p.elo}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text3)" }}>ELO</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
