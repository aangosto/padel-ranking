// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Layout from "./components/Layout";
import LoginPage          from "./pages/LoginPage";
import RankingPage        from "./pages/RankingPage";
import MatchPage          from "./pages/MatchPage";
import ProfilePage        from "./pages/ProfilePage";
import PlayerProfilePage  from "./pages/PlayerProfilePage";
import InboxPage          from "./pages/InboxPage";
import AuditPage          from "./pages/AuditPage";
import { Spinner }        from "./components/UI";

function ProtectedRoutes() {
  const { user } = useAuth();
  if (user === undefined) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Spinner size={40} />
    </div>
  );
  if (user === null) return <LoginPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/"                    element={<Navigate to="/ranking" replace />} />
        <Route path="/ranking"             element={<RankingPage />} />
        <Route path="/match/new"           element={<MatchPage />} />
        <Route path="/match/edit/:matchId" element={<MatchPage />} />
        <Route path="/profile"             element={<ProfilePage />} />
        <Route path="/player/:uid"         element={<PlayerProfilePage />} />
        <Route path="/inbox"               element={<InboxPage />} />
        <Route path="/audit"               element={<AuditPage />} />
        <Route path="*"                    element={<Navigate to="/ranking" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
