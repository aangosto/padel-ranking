// src/pages/MatchPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { computeMatchElo, setsWinner, formatSets } from "../elo";
import { sendNotification } from "../hooks/useNotifications";
import { audit, AuditEvent } from "../audit";
import { Avatar, SidePill, GuestBadge, Spinner } from "../components/UI";

const SIDES = ["Derecha", "Revés"];

// ── Score grid ────────────────────────────────────────────────────────────────
function ScoreGrid({ team1, team2, sets, setSets, bestOf, setBestOf, allPlayers, guestNames }) {
  const maxSets = bestOf;

  const getLabel = (slot) => {
    if (!slot.uid) return "—";
    if (slot.uid.startsWith("guest_")) return guestNames[slot.uid] || "Invitado";
    return allPlayers.find((p) => p.uid === slot.uid)?.name?.split(" ")[0] || "—";
  };

  const t1label = team1.map(getLabel).filter((n) => n !== "—").join(" / ") || "Pareja 1";
  const t2label = team2.map(getLabel).filter((n) => n !== "—").join(" / ") || "Pareja 2";

  const updateSet = (setIdx, team, value) => {
    const next = [...sets];
    while (next.length <= setIdx) next.push([null, null]);
    const s = [...(next[setIdx] || [null, null])];
    s[team === 1 ? 0 : 1] = value === "" ? null : parseInt(value, 10);
    next[setIdx] = s;
    setSets(next);
  };

  const validSets = sets.filter(([a, b]) => a !== null && b !== null && !isNaN(a) && !isNaN(b));
  const winner = setsWinner(validSets);
  const w1 = validSets.filter(([a, b]) => a > b).length;
  const w2 = validSets.filter(([a, b]) => b > a).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Best of toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label className="label" style={{ margin: 0 }}>Resultado</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text3)", letterSpacing: 1 }}>AL MEJOR DE</span>
          {[3, 5].map((n) => (
            <button key={n} type="button" onClick={() => { setBestOf(n); setSets(Array(n).fill([null, null])); }}
              style={{
                width: 32, height: 28,
                fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14,
                borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                background: bestOf === n ? "var(--accent)" : "var(--bg2)",
                border: `1.5px solid ${bestOf === n ? "var(--accent)" : "var(--border2)"}`,
                color: bestOf === n ? "#fff" : "var(--text3)",
              }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Grid table */}
      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow)" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(" + maxSets + ", 56px)", background: "var(--bg3)", borderBottom: "1.5px solid var(--border)" }}>
          <div style={{ padding: "8px 12px", fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text3)" }}>
            Pareja
          </div>
          {Array.from({ length: maxSets }).map((_, i) => (
            <div key={i} style={{ padding: "8px 0", textAlign: "center", fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--text3)", textTransform: "uppercase" }}>
              Set {i + 1}
            </div>
          ))}
        </div>

        {/* Team 1 row */}
        {[
          { slots: team1, label: t1label, teamNum: 1, color: "#16a34a" },
          { slots: team2, label: t2label, teamNum: 2, color: "#2563eb" },
        ].map(({ slots, label, teamNum, color }) => {
          const setsWon = teamNum === 1 ? w1 : w2;
          const isWinner = winner === teamNum;
          return (
            <div key={teamNum} style={{
              display: "grid", gridTemplateColumns: "1fr repeat(" + maxSets + ", 56px)",
              borderBottom: teamNum === 1 ? "1px solid var(--border)" : "none",
              background: isWinner ? (teamNum === 1 ? "#f0fdf4" : "#eff6ff") : "#fff",
            }}>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)", lineHeight: 1.2 }}>
                    {label}
                  </div>
                  {isWinner && (
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700, letterSpacing: 1, color, textTransform: "uppercase" }}>
                      ✓ Ganador
                    </div>
                  )}
                </div>
                {setsWon > 0 && (
                  <div style={{
                    marginLeft: "auto", fontFamily: "var(--font-head)", fontWeight: 900,
                    fontSize: 20, color, background: color + "18",
                    width: 30, height: 30, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{setsWon}</div>
                )}
              </div>
              {Array.from({ length: maxSets }).map((_, setIdx) => {
                const val = sets[setIdx]?.[teamNum === 1 ? 0 : 1];
                const oppVal = sets[setIdx]?.[teamNum === 1 ? 1 : 0];
                const isSetWin = val !== null && val !== undefined && !isNaN(val) && oppVal !== null && oppVal !== undefined && !isNaN(oppVal) && val > oppVal;
                return (
                  <div key={setIdx} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderLeft: "1px solid var(--border)",
                    background: isSetWin ? color + "12" : "transparent",
                  }}>
                    <input
                      type="number" min="0" max="7"
                      value={val !== null && val !== undefined && !isNaN(val) ? val : ""}
                      onChange={(e) => updateSet(setIdx, teamNum, e.target.value)}
                      style={{
                        width: 40, height: 40, textAlign: "center",
                        fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18,
                        border: "none", background: "transparent", color: isSetWin ? color : "var(--text)",
                        borderRadius: 0, padding: 0,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Winner preview */}
      {winner && (
        <div style={{
          background: "#f0fdf4", border: "1.5px solid #86efac",
          borderRadius: 8, padding: "10px 14px",
          fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "#15803d",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ✓ Gana <strong>{winner === 1 ? t1label : t2label}</strong>
        </div>
      )}
    </div>
  );
}

// ── Player slot ───────────────────────────────────────────────────────────────
function PlayerSlot({ slot, onChange, allPlayers, exclude, label, guestNames, setGuestNames }) {
  const [mode, setMode] = useState(slot.uid?.startsWith("guest_") ? "guest" : "registered");
  const [guestName, setGuestName] = useState(guestNames[slot.uid] || "");
  const player = allPlayers.find((p) => p.uid === slot.uid);

  const switchToGuest = () => {
    setMode("guest");
    const gid = "guest_" + Date.now();
    onChange({ uid: gid, side: slot.side });
    setGuestNames((prev) => ({ ...prev, [gid]: "" }));
  };

  const switchToRegistered = () => {
    setMode("registered");
    onChange({ uid: "", side: slot.side });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--border2)" }}>
        <button type="button" onClick={switchToRegistered} style={{
          flex: 1, padding: "7px 0",
          fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
          background: mode === "registered" ? "var(--accent)" : "var(--bg2)",
          color: mode === "registered" ? "#fff" : "var(--text3)",
          borderRight: "1px solid var(--border2)", cursor: "pointer", transition: "all 0.15s",
        }}>Registrado</button>
        <button type="button" onClick={switchToGuest} style={{
          flex: 1, padding: "7px 0",
          fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
          background: mode === "guest" ? "#d97706" : "var(--bg2)",
          color: mode === "guest" ? "#fff" : "var(--text3)",
          cursor: "pointer", transition: "all 0.15s",
        }}>Invitado</button>
      </div>

      {mode === "registered" ? (
        <select value={slot.uid} onChange={(e) => {
          const p = allPlayers.find((x) => x.uid === e.target.value);
          onChange({ uid: e.target.value, side: p?.side || slot.side || "" });
        }}>
          <option value="">-- Seleccionar jugador --</option>
          {allPlayers.filter((p) => !exclude.includes(p.uid) || p.uid === slot.uid).map((p) => (
            <option key={p.uid} value={p.uid}>{p.name}</option>
          ))}
        </select>
      ) : (
        <input
          placeholder="Nombre del invitado"
          value={guestName}
          onChange={(e) => {
            setGuestName(e.target.value);
            setGuestNames((prev) => ({ ...prev, [slot.uid]: e.target.value }));
          }}
        />
      )}

      {/* Side selector */}
      {slot.uid && (
        <div style={{ display: "flex", gap: 6 }}>
          {SIDES.map((s) => (
            <button key={s} type="button" onClick={() => onChange({ ...slot, side: s })} style={{
              flex: 1, padding: "7px 0",
              fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12,
              letterSpacing: 1, textTransform: "uppercase",
              borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
              background: slot.side === s ? (s === "Derecha" ? "#dcfce7" : "#dbeafe") : "var(--bg)",
              border: `1.5px solid ${slot.side === s ? (s === "Derecha" ? "#16a34a" : "#2563eb") : "var(--border2)"}`,
              color: slot.side === s ? (s === "Derecha" ? "#15803d" : "#1d4ed8") : "var(--text3)",
            }}>{s}</button>
          ))}
        </div>
      )}

      {player && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.7 }}>
          <Avatar name={player.name} photoURL={player.photoURL} size={22} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)" }}>
            {player.name} · {player.elo} ELO
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MatchPage() {
  const { matchId } = useParams();
  const isEdit = !!matchId;
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptySlot = { uid: "", side: "" };
  const [team1, setTeam1] = useState([{ ...emptySlot }, { ...emptySlot }]);
  const [team2, setTeam2] = useState([{ ...emptySlot }, { ...emptySlot }]);
  const [sets, setSets] = useState([[null, null], [null, null], [null, null]]);
  const [bestOf, setBestOf] = useState(3);
  const [guestNames, setGuestNames] = useState({});
  const [originalMatch, setOriginalMatch] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const ps = snap.docs.map((d) => d.data());
      setAllPlayers(ps);

      if (isEdit) {
        const mSnap = await getDoc(doc(db, "matches", matchId));
        if (mSnap.exists()) {
          const m = mSnap.data();
          setOriginalMatch(m);
          setTeam1(m.team1);
          setTeam2(m.team2);
          setSets(m.sets.map(([a, b]) => [a, b]));
          setBestOf(m.bestOf || 3);
          setGuestNames(m.guestNames || {});
        }
      } else if (profile) {
        setTeam1([{ uid: profile.uid, side: profile.side || "" }, { ...emptySlot }]);
      }
      setLoading(false);
    })();
  }, [matchId]);

  const updateSlot = (team, idx, value) => {
    const setter = team === 1 ? setTeam1 : setTeam2;
    setter((prev) => { const next = [...prev]; next[idx] = value; return next; });
  };

  const allUids = [...team1, ...team2].map((s) => s.uid).filter((u) => u && !u.startsWith("guest_"));
  const exclude1 = team2.map((s) => s.uid).filter(Boolean);
  const exclude2 = team1.map((s) => s.uid).filter(Boolean);

  const validSets = sets.filter(([a, b]) => a !== null && b !== null && !isNaN(a) && !isNaN(b));
  const winner = setsWinner(validSets);

  const canSubmit = () => {
    const allSlots = [...team1, ...team2];
    if (allSlots.some((s) => !s.uid)) return false;
    if (allSlots.some((s) => !s.side)) return false;
    return winner !== null;
  };

  const handleSubmit = async () => {
    setError("");
    if (!canSubmit()) { setError("Completa todos los campos, asigna lado a cada jugador y asegúrate de que el marcador tiene un ganador."); return; }
    setSaving(true);
    try {
      const cleanSets = validSets;

      const t1Data = team1.map((s) => ({
        uid: s.uid,
        elo: allPlayers.find((p) => p.uid === s.uid)?.elo ?? 1000,
        isGuest: s.uid.startsWith("guest_"),
      }));
      const t2Data = team2.map((s) => ({
        uid: s.uid,
        elo: allPlayers.find((p) => p.uid === s.uid)?.elo ?? 1000,
        isGuest: s.uid.startsWith("guest_"),
      }));
      const eloMap = computeMatchElo(t1Data, t2Data, winner);

      const matchData = {
        team1, team2,
        sets: cleanSets,
        bestOf,
        winner,
        playerIds: [...team1, ...team2].map((s) => s.uid),
        registeredPlayerIds: allUids,
        eloMap,
        guestNames,
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, "matches", matchId), matchData);
        const others = allUids.filter((uid) => uid !== user.uid);
        await Promise.all(others.map((uid) =>
          sendNotification(uid, {
            type: "MATCH_EDITED",
            title: "Resultado modificado",
            body: `${profile?.name} modificó el resultado de un partido tuyo. Sets: ${formatSets(cleanSets)}`,
            matchId,
          })
        ));
        await audit({ event: AuditEvent.MATCH_EDITED, uid: user.uid, name: profile?.name, meta: { matchId, before: { sets: originalMatch?.sets }, after: { sets: cleanSets } } });
      } else {
        matchData.createdAt = serverTimestamp();
        const ref2 = await addDoc(collection(db, "matches"), matchData);
        await Promise.all(allUids.map((uid) =>
          sendNotification(uid, {
            type: "MATCH_CREATED",
            title: "Nuevo partido registrado",
            body: `${profile?.name} registró un partido. Sets: ${formatSets(cleanSets)}`,
            matchId: ref2.id,
          })
        ));
        // Update ELO
        await Promise.all(allUids.map((uid) => {
          const isWinner = winner === 1 ? team1.some((s) => s.uid === uid) : team2.some((s) => s.uid === uid);
          const p = allPlayers.find((x) => x.uid === uid);
          return updateDoc(doc(db, "users", uid), {
            elo: eloMap[uid].elo,
            wins:   (p?.wins   || 0) + (isWinner ? 1 : 0),
            losses: (p?.losses || 0) + (isWinner ? 0 : 1),
          });
        }));
        await audit({ event: AuditEvent.MATCH_CREATED, uid: user.uid, name: profile?.name, meta: { matchId: ref2.id, sets: cleanSets, winner, players: allUids } });
      }
      navigate("/ranking");
    } catch (e) {
      setError("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 28, letterSpacing: 3, textTransform: "uppercase" }}>
          {isEdit ? "✏️ Editar" : "🎾 Nuevo"} <span style={{ color: "var(--accent)" }}>Partido</span>
        </div>
      </div>

      {/* Teams */}
      {[
        { label: "Pareja 1", color: "#16a34a", team: team1, teamNum: 1, exclude: exclude1 },
        { label: "Pareja 2", color: "#2563eb", team: team2, teamNum: 2, exclude: exclude2 },
      ].map(({ label, color, team, teamNum, exclude }) => (
        <div key={teamNum} style={{
          background: "#fff", border: `1.5px solid ${color}44`,
          borderRadius: "var(--radius)", padding: 16, boxShadow: "var(--shadow)",
        }}>
          <div style={{
            fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14,
            letterSpacing: 2, textTransform: "uppercase", color, marginBottom: 14,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {team.map((slot, i) => (
              <div key={i}>
                {i > 0 && <div style={{ borderTop: "1px solid var(--border)", marginBottom: 14 }} />}
                <label className="label">Jugador {i + 1}</label>
                <PlayerSlot
                  slot={slot}
                  onChange={(val) => updateSlot(teamNum, i, val)}
                  allPlayers={allPlayers}
                  exclude={exclude}
                  label={`Jugador ${i + 1}`}
                  guestNames={guestNames}
                  setGuestNames={setGuestNames}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Score grid */}
      <div className="card">
        <ScoreGrid
          team1={team1} team2={team2}
          sets={sets} setSets={setSets}
          bestOf={bestOf} setBestOf={setBestOf}
          allPlayers={allPlayers} guestNames={guestNames}
        />
      </div>

      {error && (
        <div style={{ background: "var(--danger-bg)", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "var(--danger)", fontFamily: "var(--font-body)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" style={{ width: "100%", padding: 14, fontSize: 16 }}
        onClick={handleSubmit} disabled={!canSubmit() || saving}>
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar partido"}
      </button>
    </div>
  );
}
