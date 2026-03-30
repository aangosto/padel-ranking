// src/pages/PlayerProfilePage.jsx
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, TierBadge, SidePill, DeltaPill, Spinner } from "../components/UI";
import { getTier, formatSets } from "../elo";
import { useAuth } from "../hooks/useAuth";

export default function PlayerProfilePage() {
  const { uid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid === uid) { navigate("/profile", { replace: true }); return; }
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) { navigate("/ranking"); return; }
      setProfile(snap.data());

      const q = query(
        collection(db, "matches"),
        where("playerIds", "array-contains", uid),
        orderBy("createdAt", "desc")
      );
      const mSnap = await getDocs(q);
      setMatches(mSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [uid]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={36} /></div>;
  if (!profile) return null;

  const tier = getTier(profile.elo);
  const wl = (profile.wins || 0) + (profile.losses || 0);
  const winRate = wl > 0 ? Math.round((profile.wins / wl) * 100) : null;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button className="btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {/* Profile card */}
      <div className="card" style={{ textAlign: "center", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <Avatar name={profile.name} photoURL={profile.photoURL} size={80} />
        </div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 26, letterSpacing: 1, color: "var(--text)" }}>
          {profile.name}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <TierBadge elo={profile.elo} />
          {profile.side && <SidePill side={profile.side} />}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          {[
            { label: "ELO", value: profile.elo, color: tier.color },
            { label: "Victorias", value: profile.wins || 0, color: "#15803d" },
            { label: "Derrotas", value: profile.losses || 0, color: "#dc2626" },
            winRate !== null ? { label: "Win %", value: winRate + "%", color: "var(--accent)" } : null,
          ].filter(Boolean).map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              padding: "0 8px",
            }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 10, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "var(--text2)", marginBottom: 12 }}>
          Preferencias
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Row label="Pala" value={profile.paddle || <span style={{ color: "var(--text3)" }}>No especificada</span>} />
          <Row label="Lado preferido" value={profile.side ? <SidePill side={profile.side} /> : <span style={{ color: "var(--text3)" }}>No especificado</span>} />
        </div>
      </div>

      {/* Match history */}
      <div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, color: "var(--text)" }}>
          Historial de partidos
        </div>
        {matches.length === 0 && (
          <div style={{ color: "var(--text3)", fontFamily: "var(--font-body)", fontSize: 14, textAlign: "center", padding: 20 }}>
            Sin partidos registrados aún.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {matches.map((m) => {
            const myTeam = m.team1.some((s) => s.uid === uid) ? 1 : 2;
            const won = m.winner === myTeam;
            const mySide = (myTeam === 1 ? m.team1 : m.team2).find((s) => s.uid === uid)?.side;
            const delta = m.eloMap?.[uid]?.delta;
            return (
              <div key={m.id} style={{
                background: "#fff",
                border: `1.5px solid ${won ? "#86efac" : "#fca5a5"}`,
                borderRadius: "var(--radius)", padding: "12px 14px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                boxShadow: "var(--shadow)",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: won ? "#15803d" : "#dc2626" }}>
                    {won ? "VICTORIA" : "DERROTA"}
                  </div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 14, color: "var(--text2)", letterSpacing: 1 }}>
                    {formatSets(m.sets)}
                  </div>
                  {mySide && <SidePill side={mySide} />}
                </div>
                {delta !== undefined && <DeltaPill delta={delta} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-head)", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text3)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>{value}</span>
    </div>
  );
}
