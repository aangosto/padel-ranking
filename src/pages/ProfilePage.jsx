// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { audit, AuditEvent } from "../audit";
import { Avatar, TierBadge, SidePill, DeltaPill, Spinner } from "../components/UI";
import { formatSets, getTier } from "../elo";
import { useNavigate } from "react-router-dom";

const SIDES = ["Derecha", "Revés"];

export default function ProfilePage() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [paddle, setPaddle] = useState(profile?.paddle || "");
  const [side, setSide] = useState(profile?.side || "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(
        collection(db, "matches"),
        where("playerIds", "array-contains", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingMatches(false);
    })();
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      await refreshProfile();
    } catch (err) {
      alert("Error al subir la foto: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const before = { paddle: profile?.paddle, side: profile?.side };
    await updateDoc(doc(db, "users", user.uid), { paddle, side });
    await audit({ event: AuditEvent.PROFILE_UPDATED, uid: user.uid, name: profile?.name, meta: { before, after: { paddle, side } } });
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  };

  if (!profile) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  const tier = getTier(profile.elo);
  const wl = (profile.wins || 0) + (profile.losses || 0);
  const winRate = wl > 0 ? Math.round((profile.wins / wl) * 100) : null;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile card */}
      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        {/* Photo upload */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
          <Avatar name={profile.name} photoURL={profile.photoURL} size={80} />
          <label style={{
            position: "absolute", bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: "50%",
            background: "var(--accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 13, border: "2px solid #fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}>
            {uploadingPhoto ? <Spinner size={12} /> : "📷"}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 24, color: "var(--text)" }}>
          {profile.name}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text3)", marginBottom: 10 }}>
          {profile.email}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <TierBadge elo={profile.elo} />
          {profile.side && <SidePill side={profile.side} />}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16, gap: 0 }}>
          {[
            { label: "ELO", value: profile.elo, color: tier.color },
            { label: "Victorias", value: profile.wins || 0, color: "#15803d" },
            { label: "Derrotas", value: profile.losses || 0, color: "#dc2626" },
            winRate !== null ? { label: "Win %", value: winRate + "%", color: "var(--accent)" } : null,
          ].filter(Boolean).map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 10, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "var(--text2)" }}>
            Preferencias
          </div>
          {!editing && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }}
              onClick={() => { setEditing(true); setPaddle(profile.paddle || ""); setSide(profile.side || ""); }}>
              ✏️ Editar
            </button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="Pala" value={profile.paddle || <span style={{ color: "var(--text3)" }}>No especificada</span>} />
            <Row label="Lado preferido" value={profile.side ? <SidePill side={profile.side} /> : <span style={{ color: "var(--text3)" }}>No especificado</span>} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Pala</label>
              <input value={paddle} onChange={(e) => setPaddle(e.target.value)} placeholder="Ej: Head Delta Pro" />
            </div>
            <div>
              <label className="label">Lado preferido</label>
              <div style={{ display: "flex", gap: 8 }}>
                {SIDES.map((s) => (
                  <button key={s} type="button" onClick={() => setSide(s === side ? "" : s)} style={{
                    flex: 1, padding: "10px 0",
                    fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14,
                    letterSpacing: 1, textTransform: "uppercase",
                    borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                    background: side === s ? (s === "Derecha" ? "#dcfce7" : "#dbeafe") : "var(--bg)",
                    border: `1.5px solid ${side === s ? (s === "Derecha" ? "#16a34a" : "#2563eb") : "var(--border2)"}`,
                    color: side === s ? (s === "Derecha" ? "#15803d" : "#1d4ed8") : "var(--text3)",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Match history */}
      <div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, color: "var(--text)" }}>
          Mis partidos
        </div>
        {loadingMatches ? <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {matches.length === 0 && (
              <div style={{ color: "var(--text3)", fontFamily: "var(--font-body)", fontSize: 14, textAlign: "center", padding: 20 }}>
                Aún no tienes partidos registrados.
              </div>
            )}
            {matches.map((m) => {
              const myTeam = m.team1.some((s) => s.uid === user.uid) ? 1 : 2;
              const won = m.winner === myTeam;
              const mySide = (myTeam === 1 ? m.team1 : m.team2).find((s) => s.uid === user.uid)?.side;
              const delta = m.eloMap?.[user.uid]?.delta;
              return (
                <div key={m.id} style={{
                  background: "#fff", border: `1.5px solid ${won ? "#86efac" : "#fca5a5"}`,
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {delta !== undefined && <DeltaPill delta={delta} />}
                    <button className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}
                      onClick={() => navigate(`/match/edit/${m.id}`)}>✏️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={logout} className="btn-danger" style={{ width: "100%", justifyContent: "center", padding: "12px 0" }}>
        Cerrar sesión
      </button>
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
