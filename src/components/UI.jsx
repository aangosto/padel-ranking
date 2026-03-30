// src/components/UI.jsx
import { getTier } from "../elo";

const AVATAR_PALETTES = [
  ["#16a34a","#dcfce7"],["#ea580c","#fff7ed"],["#0891b2","#ecfeff"],
  ["#9333ea","#faf5ff"],["#0284c7","#eff6ff"],["#ca8a04","#fefce8"],
  ["#be185d","#fdf2f8"],["#dc2626","#fef2f2"],
];
function avatarPalette(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}
function initials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase()).slice(0, 2).join("");
}

export function Avatar({ name = "", photoURL, size = 40 }) {
  const [fg, bg] = avatarPalette(name);
  const style = {
    width: size, height: size, borderRadius: "50%",
    overflow: "hidden", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: bg, border: `2px solid ${fg}33`,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800, fontSize: size * 0.38,
    color: fg, letterSpacing: 0.5,
    userSelect: "none",
  };
  if (photoURL) return (
    <div style={style}>
      <img src={photoURL} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
  return <div style={style}>{initials(name)}</div>;
}

export function TierBadge({ elo }) {
  const tier = getTier(elo);
  return (
    <span style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700, fontSize: 10, letterSpacing: 1.5,
      textTransform: "uppercase",
      color: tier.color,
      background: tier.bg,
      border: `1px solid ${tier.color}55`,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {tier.label}
    </span>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid var(--border2)`,
      borderTopColor: "var(--accent)",
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

export function SidePill({ side }) {
  if (!side) return null;
  const isDerecha = side === "Derecha";
  return (
    <span style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700, fontSize: 10, letterSpacing: 1,
      textTransform: "uppercase",
      color: isDerecha ? "#15803d" : "#1d4ed8",
      background: isDerecha ? "#dcfce7" : "#dbeafe",
      border: `1px solid ${isDerecha ? "#86efac" : "#93c5fd"}`,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {side}
    </span>
  );
}

export function DeltaPill({ delta }) {
  if (delta === undefined || delta === null) return null;
  const pos = delta >= 0;
  return (
    <span style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700, fontSize: 12,
      color: pos ? "#15803d" : "#dc2626",
      background: pos ? "#dcfce7" : "#fef2f2",
      border: `1px solid ${pos ? "#86efac" : "#fca5a5"}`,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {pos ? "+" : ""}{delta}
    </span>
  );
}

export function GuestBadge() {
  return (
    <span style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700, fontSize: 10, letterSpacing: 1,
      textTransform: "uppercase",
      color: "#92400e", background: "#fef3c7",
      border: "1px solid #fcd34d",
      borderRadius: 4, padding: "2px 7px",
    }}>
      Invitado
    </span>
  );
}
