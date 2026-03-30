// src/pages/LoginPage.jsx
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: "-10%", right: "-15%", width: "50vw", height: "50vw", borderRadius: "50%", background: "rgba(22,163,74,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-15%", width: "40vw", height: "40vw", borderRadius: "50%", background: "rgba(22,163,74,0.04)", pointerEvents: "none" }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 340, width: "100%" }}>
        {/* Badge */}
        <div style={{
          display: "inline-block",
          background: "#dcfce7", border: "1.5px solid #86efac",
          borderRadius: 20, padding: "4px 14px",
          fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
          letterSpacing: 2, color: "#15803d", textTransform: "uppercase",
          marginBottom: 16,
        }}>Nueva Condomina · Murcia</div>

        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, margin: "0 auto 20px",
          boxShadow: "0 8px 32px rgba(22,163,74,0.3)",
        }}>🎾</div>

        <h1 style={{
          fontFamily: "var(--font-head)", fontWeight: 900,
          fontSize: 44, letterSpacing: 2, textTransform: "uppercase",
          lineHeight: 1, marginBottom: 4, color: "var(--text)",
        }}>
          NC <span style={{ color: "var(--accent)" }}>Pádel</span>
        </h1>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: 14, letterSpacing: 4,
          color: "var(--text3)", textTransform: "uppercase", marginBottom: 8,
        }}>Ranking Oficial</div>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text3)",
          marginBottom: 40, lineHeight: 1.5,
        }}>Sistema ELO · Dobles · Temporada 2026</div>

        <button
          onClick={login}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "14px 24px",
            background: "#fff", border: "1.5px solid var(--border2)",
            borderRadius: 10, color: "var(--text)",
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16,
            letterSpacing: 1.5, textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
        >
          <GoogleIcon />
          Entrar con Google
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
          Tu perfil se crea automáticamente la primera vez que entras.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
